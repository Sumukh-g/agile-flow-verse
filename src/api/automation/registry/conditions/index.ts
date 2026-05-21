import { Injectable } from '@nestjs/common';
import { ICondition, ConditionKey, ExecutionContext } from '../../types';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Resolves a dot-notation path from a flat merged object.
 * Source priority (highest → lowest): after → before → metadata → variables
 */
function resolveField(path: string, context: ExecutionContext): unknown {
  const merged: Record<string, unknown> = {
    ...context.variables,
    ...context.payload.metadata,
    ...context.payload.before,
    ...context.payload.after,
  };
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, merged as unknown);
}

// ─── Scalar equality conditions ───────────────────────────────────────────────

@Injectable()
export class FieldEqualsCondition implements ICondition {
  readonly key: ConditionKey = 'field.equals';
  readonly displayName = 'Field Equals';

  evaluate(params: Record<string, unknown>, context: ExecutionContext): boolean {
    const { field, value } = params as { field: string; value: unknown };
    // eslint-disable-next-line eqeqeq
    return resolveField(field, context) == value;
  }
}

@Injectable()
export class FieldNotEqualsCondition implements ICondition {
  readonly key: ConditionKey = 'field.not_equals';
  readonly displayName = 'Field Not Equals';

  evaluate(params: Record<string, unknown>, context: ExecutionContext): boolean {
    const { field, value } = params as { field: string; value: unknown };
    // eslint-disable-next-line eqeqeq
    return resolveField(field, context) != value;
  }
}

// ─── String containment conditions ────────────────────────────────────────────

@Injectable()
export class FieldContainsCondition implements ICondition {
  readonly key: ConditionKey = 'field.contains';
  readonly displayName = 'Field Contains';

  evaluate(params: Record<string, unknown>, context: ExecutionContext): boolean {
    const { field, value } = params as { field: string; value: unknown };
    const fieldValue = resolveField(field, context);
    return String(fieldValue ?? '').toLowerCase().includes(String(value).toLowerCase());
  }
}

@Injectable()
export class FieldNotContainsCondition implements ICondition {
  readonly key: ConditionKey = 'field.not_contains';
  readonly displayName = 'Field Not Contains';

  evaluate(params: Record<string, unknown>, context: ExecutionContext): boolean {
    const { field, value } = params as { field: string; value: unknown };
    const fieldValue = resolveField(field, context);
    return !String(fieldValue ?? '').toLowerCase().includes(String(value).toLowerCase());
  }
}

// ─── Numeric comparison conditions ────────────────────────────────────────────

@Injectable()
export class FieldGreaterThanCondition implements ICondition {
  readonly key: ConditionKey = 'field.greater_than';
  readonly displayName = 'Field Greater Than';

  evaluate(params: Record<string, unknown>, context: ExecutionContext): boolean {
    const { field, value } = params as { field: string; value: unknown };
    return Number(resolveField(field, context)) > Number(value);
  }
}

@Injectable()
export class FieldLessThanCondition implements ICondition {
  readonly key: ConditionKey = 'field.less_than';
  readonly displayName = 'Field Less Than';

  evaluate(params: Record<string, unknown>, context: ExecutionContext): boolean {
    const { field, value } = params as { field: string; value: unknown };
    return Number(resolveField(field, context)) < Number(value);
  }
}

// ─── Emptiness conditions ─────────────────────────────────────────────────────

@Injectable()
export class FieldIsEmptyCondition implements ICondition {
  readonly key: ConditionKey = 'field.is_empty';
  readonly displayName = 'Field Is Empty';

  evaluate(params: Record<string, unknown>, context: ExecutionContext): boolean {
    const { field } = params as { field: string };
    const v = resolveField(field, context);
    return v === null || v === undefined || v === '';
  }
}

@Injectable()
export class FieldIsNotEmptyCondition implements ICondition {
  readonly key: ConditionKey = 'field.is_not_empty';
  readonly displayName = 'Field Is Not Empty';

  evaluate(params: Record<string, unknown>, context: ExecutionContext): boolean {
    const { field } = params as { field: string };
    const v = resolveField(field, context);
    return v !== null && v !== undefined && v !== '';
  }
}

// ─── Role / permission condition ──────────────────────────────────────────────

@Injectable()
export class UserHasRoleCondition implements ICondition {
  readonly key: ConditionKey = 'user.has_role';
  readonly displayName = 'User Has Role';

  constructor(private readonly prisma: PrismaService) {}

  async evaluate(params: Record<string, unknown>, context: ExecutionContext): Promise<boolean> {
    const { role, projectId } = params as { role: string; projectId?: string };
    const userId = context.userId ?? (context.payload.userId as string | undefined);
    if (!userId) return false;

    if (projectId) {
      // Check project-scoped role via ProjectMember
      const member = await this.prisma.projectMember.findFirst({
        where: { userId, tenantId: context.tenantId, projectId, role },
      });
      return !!member;
    }

    // Check tenant-scoped role via RoleAssignment → Role.name
    const assignment = await this.prisma.roleAssignment.findFirst({
      where: {
        userId,
        tenantId: context.tenantId,
        role: { name: role },
      },
    });
    return !!assignment;
  }
}
