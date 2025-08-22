import { requireRole } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
const prisma = new PrismaClient();
export async function POST(request, { params }) {
    try {
        // Check admin role
        const user = await requireRole(request, 'sys_admin');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized - sys_admin role required' }, { status: 403 });
        }
        const tenantId = params.id;
        const body = await request.json();
        // Validate tenant exists
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }
        // Validate request body
        if (!body.features || !Array.isArray(body.features)) {
            return NextResponse.json({ error: 'Invalid request body - features array required' }, { status: 400 });
        }
        // Validate each feature update
        for (const feature of body.features) {
            if (!feature.key || typeof feature.enabled !== 'boolean') {
                return NextResponse.json({ error: 'Invalid feature update - key and enabled required' }, { status: 400 });
            }
        }
        // Update features in transaction
        const result = await prisma.$transaction(async (tx) => {
            const updatedFeatures = [];
            for (const feature of body.features) {
                const updatedFeature = await tx.tenantFeature.upsert({
                    where: {
                        tenantId_featureKey: {
                            tenantId: tenantId,
                            featureKey: feature.key
                        }
                    },
                    update: {
                        enabled: feature.enabled,
                        updatedAt: new Date()
                    },
                    create: {
                        tenantId: tenantId,
                        featureKey: feature.key,
                        enabled: feature.enabled,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
                updatedFeatures.push(updatedFeature);
            }
            return updatedFeatures;
        });
        // Log the action for audit
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_TENANT_FEATURES',
                userId: user.id,
                tenantId: tenantId,
                details: {
                    features: body.features,
                    updatedBy: user.email
                },
                createdAt: new Date()
            }
        });
        return NextResponse.json({
            success: true,
            message: 'Tenant features updated successfully',
            data: {
                tenantId,
                features: result
            }
        });
    }
    catch (error) {
        console.error('Error updating tenant features:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function GET(request, { params }) {
    try {
        // Check admin role
        const user = await requireRole(request, 'sys_admin');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized - sys_admin role required' }, { status: 403 });
        }
        const tenantId = params.id;
        // Get tenant with features
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                features: true
            }
        });
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }
        return NextResponse.json({
            success: true,
            data: {
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                    sku: tenant.sku,
                    createdAt: tenant.createdAt,
                    updatedAt: tenant.updatedAt
                },
                features: tenant.features
            }
        });
    }
    catch (error) {
        console.error('Error fetching tenant features:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
