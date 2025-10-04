# 🔒 Monitoring Security TODO List

## Current Status

### Grafana
- **Default Password**: `admin123` (from docker-compose.yml)
- **Current Status**: Not properly secured
- **Access**: http://167.71.247.15:3001
- **Login**: admin / admin123

### Prometheus  
- **Password**: No authentication configured
- **Current Status**: Completely open access
- **Access**: http://167.71.247.15:9090
- **Login**: None (open access)

## 🚨 Security Issues to Fix

### 1. Grafana Security
- [ ] **Change default password** from `admin123`
- [ ] **Configure email settings** for password reset
- [ ] **Set up SMTP configuration**
- [ ] **Enable user registration controls**
- [ ] **Configure session timeout**

### 2. Prometheus Security
- [ ] **Add basic authentication**
- [ ] **Configure web.yml with users**
- [ ] **Restrict access to admin only**
- [ ] **Set up proper firewall rules**

### 3. Email Configuration
- [ ] **Add email service configuration** (Gmail, SendGrid, etc.)
- [ ] **Configure SMTP settings**
- [ ] **Test email delivery**
- [ ] **Set up email templates**

### 4. Frontend URL Fix
- [ ] **Fix monitoring URLs in frontend code**
- [ ] **Test URLs work in dev/stage**
- [ ] **Deploy fix to production**
- [ ] **Verify admin account can access monitoring**

## 🔧 Required Changes

### Email Configuration (Choose One)

#### Option A: Gmail SMTP
```yaml
# Add to docker-compose.yml grafana environment
- GF_SMTP_ENABLED=true
- GF_SMTP_HOST=smtp.gmail.com:587
- GF_SMTP_USER=your-email@gmail.com
- GF_SMTP_PASSWORD=your-app-password
- GF_SMTP_FROM_ADDRESS=your-email@gmail.com
```

#### Option B: SendGrid
```yaml
# Add to docker-compose.yml grafana environment
- GF_SMTP_ENABLED=true
- GF_SMTP_HOST=smtp.sendgrid.net:587
- GF_SMTP_USER=apikey
- GF_SMTP_PASSWORD=your-sendgrid-api-key
- GF_SMTP_FROM_ADDRESS=noreply@yourdomain.com
```

### Prometheus Authentication
```yaml
# Create web.yml configuration
basic_auth_users:
  admin: $2b$12$hNf2lSsxfm0.i4a.1kVpSOVyQnVh1Z6V6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6  # password hash
```

## 📧 Email Address for Password Reset
**Your Email**: rnkinch@gmail.com

## 🔗 URL Issue Details
**Problem**: Frontend shows `@https://167.71.247.15/api:3001/grafana/` instead of correct URLs
**Correct URLs Should Be**:
- Grafana: `http://167.71.247.15:3001`
- Prometheus: `http://167.71.247.15:9090`

**Status**: Dev/stage work correctly, production has malformed URLs
**Root Cause**: Frontend code constructing URLs incorrectly in production

## 🎯 Priority Order
1. **Fix frontend monitoring URLs** (dev → stage → production)
2. **Secure Grafana with proper password**
3. **Add email configuration for password reset**
4. **Secure Prometheus with authentication**
5. **Test all monitoring access from admin account**

## 📝 Next Steps (Dev → Stage → Production Workflow)

### Step 1: Fix Frontend Monitoring URLs
1. **Investigate frontend code** for URL construction logic
2. **Test fix in dev environment** first
3. **Test fix in stage environment** 
4. **Deploy fix to production** after validation
5. **Verify admin account can access monitoring**

### Step 2: Configure Monitoring Security
1. **Set up email configuration** (Gmail/SendGrid)
2. **Configure Grafana security** with proper passwords
3. **Secure Prometheus** with authentication
4. **Test password reset functionality**
5. **Verify all security measures work**

## 🔍 Current Production Status (Need to Verify)
- **Grafana Password**: Unknown (need to check actual deployment)
- **Prometheus Access**: Unknown (need to verify current state)
- **Email Configuration**: Not configured
- **URL Issue**: Frontend shows malformed URLs in production
