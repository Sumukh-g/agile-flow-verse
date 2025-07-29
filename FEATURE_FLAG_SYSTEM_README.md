# Feature Flag System

A comprehensive feature flag system that allows support engineers to promote tenants to Enterprise SKU and automatically enable premium features.

## 🏗️ Architecture

### Database Schema

```sql
-- Tenants table
CREATE TABLE tenants (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  sku ENUM('basic', 'pro', 'enterprise') DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tenant features table
CREATE TABLE tenant_features (
  tenant_id VARCHAR(255) NOT NULL,
  feature_key VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, feature_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Feature Mapping

| SKU | WBS & Gantt | Risk Register | AI Insights | Advanced Analytics | Custom Integrations | Priority Support |
|-----|-------------|---------------|-------------|-------------------|-------------------|------------------|
| **Basic** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pro** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Enterprise** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🚀 CLI Tool

### Usage

```bash
# Upgrade a tenant to Enterprise SKU
npm run upgrade-tenant upgrade --tenant acme-corp --sku enterprise

# Upgrade a tenant to Pro SKU
npm run upgrade-tenant upgrade --tenant tenant-123 --sku pro

# Downgrade a tenant to Basic SKU
npm run upgrade-tenant upgrade --tenant acme-corp --sku basic
```

### Features

- **Tenant Lookup**: Find tenants by ID or slug
- **SKU Validation**: Ensures valid SKU values (basic|pro|enterprise)
- **Transaction Safety**: All updates happen in a database transaction
- **Feature Auto-configuration**: Automatically enables/disables features based on SKU
- **Audit Logging**: Logs all changes for compliance
- **Summary Report**: Shows what features were enabled/disabled

### Example Output

```
🔄 Upgrading tenant: Acme Corp (tenant-123)
📦 Current SKU: pro → New SKU: enterprise

✅ Upgrade completed successfully!

📊 Summary:
   Tenant: Acme Corp (tenant-123)
   SKU: enterprise
   Features updated: 6

🔧 Feature Flags:
   ✅ Enabled:
      - risk_register
      - ai_insights
      - wbs_gantt
      - advanced_analytics
      - custom_integrations
      - priority_support
```

## 🔌 Admin API

### Endpoints

#### `POST /api/admin/tenants/:id/features`

Update feature flags for a tenant.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "features": [
    { "key": "ai_insights", "enabled": true },
    { "key": "risk_register", "enabled": false }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant features updated successfully",
  "data": {
    "tenantId": "tenant-123",
    "features": [...]
  }
}
```

#### `GET /api/admin/tenants/:id/features`

Get current feature flags for a tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "tenant-123",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "sku": "enterprise",
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    },
    "features": [
      {
        "tenantId": "tenant-123",
        "featureKey": "ai_insights",
        "enabled": true,
        "createdAt": "2024-01-15T00:00:00Z",
        "updatedAt": "2024-01-15T00:00:00Z"
      }
    ]
  }
}
```

### Security

- **Role-based Access**: Only `sys_admin` users can access these endpoints
- **Input Validation**: Validates all request data
- **Audit Logging**: Logs all feature changes
- **Transaction Safety**: Uses database transactions for consistency

## 🎨 Frontend Integration

### Settings Page

The Settings page (`/settings`) provides a user-friendly interface for managing feature flags:

- **Current Plan Display**: Shows current SKU and plan details
- **Feature Toggles**: Switch to enable/disable individual features
- **Category Badges**: Visual indicators for feature categories (basic/pro/enterprise)
- **Usage Statistics**: Monitor feature usage and limits
- **Real-time Updates**: Syncs with backend after changes

### Feature Hook

Use the `useFeatures` hook in your components:

```tsx
import { useFeatures } from '@/hooks/useFeatures';

const MyComponent = () => {
  const { isFeatureEnabled, features, isLoading } = useFeatures();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isFeatureEnabled('ai_insights') && (
        <AIInsightsPanel />
      )}
      
      {isFeatureEnabled('risk_register') && (
        <RiskRegister />
      )}
    </div>
  );
};
```

### Feature Categories

- **Basic**: Core features available to all users
- **Pro**: Advanced features for professional users
- **Enterprise**: Premium features for enterprise customers

## 🔧 Development

### Prerequisites

```bash
npm install
npm install -D tsx commander
```

### Database Setup

1. Create the database tables using the schema above
2. Set up Prisma client configuration
3. Configure environment variables for database connection

### Testing

```bash
# Test CLI tool
npm run upgrade-tenant upgrade --tenant test-tenant --sku enterprise

# Test API endpoints
curl -X POST http://localhost:3000/api/admin/tenants/test-tenant/features \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"features":[{"key":"ai_insights","enabled":true}]}'
```

## 📋 Feature Flags

### Available Features

| Key | Name | Description | Category |
|-----|------|-------------|----------|
| `wbs_gantt` | WBS & Gantt Charts | Create work breakdown structures and Gantt charts | basic |
| `risk_register` | Risk Register | Track and manage project risks | pro |
| `ai_insights` | AI Insights | Get AI-powered project insights | enterprise |
| `advanced_analytics` | Advanced Analytics | Deep dive analytics with custom dashboards | enterprise |
| `custom_integrations` | Custom Integrations | Build custom integrations with existing tools | enterprise |
| `priority_support` | Priority Support | Get priority support with dedicated account management | enterprise |

### Adding New Features

1. **Update CLI**: Add the feature to `SKU_FEATURES` in `scripts/upgrade-tenant.ts`
2. **Update Frontend**: Add the feature to the settings page and feature hook
3. **Update Database**: Add the feature to the tenant_features table
4. **Update Documentation**: Add the feature to this README

## 🔒 Security Considerations

- **Role-based Access**: Only system administrators can modify feature flags
- **Audit Trail**: All changes are logged with user and timestamp
- **Input Validation**: All inputs are validated before processing
- **Transaction Safety**: Database operations use transactions
- **Rate Limiting**: API endpoints should implement rate limiting
- **Token Validation**: Admin tokens should be validated on each request

## 🚀 Deployment

### Production Checklist

- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up admin authentication
- [ ] Configure audit logging
- [ ] Set up monitoring and alerts
- [ ] Test CLI tool in production environment
- [ ] Train support team on usage

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
ADMIN_JWT_SECRET=your-secret-key
AUDIT_LOG_ENABLED=true
```

## 📞 Support

For questions or issues with the feature flag system:

1. Check the audit logs for recent changes
2. Verify tenant configuration in the database
3. Test feature flags using the CLI tool
4. Contact the development team for technical issues

---

**Note**: This system is designed for internal use by support engineers. All changes are logged and can be audited for compliance purposes. 