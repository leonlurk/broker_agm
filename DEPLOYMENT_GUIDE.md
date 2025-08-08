# 🚀 GUÍA DE DEPLOYMENT CON DOMINIO REAL

## 📋 CHECKLIST PRE-DEPLOYMENT

### 1. **Configuración del Dominio**
- [ ] Dominio registrado y apuntando al VPS (IP: tu-ip-vps)
- [ ] DNS configurado (A records)
- [ ] Certificado SSL instalado (Let's Encrypt)

### 2. **Actualización de URLs en el Frontend**

#### **Archivo: `.env.production`**
```bash
# ANTES (desarrollo local)
VITE_LOGIC_API_URL=http://localhost/api
VITE_TRADING_API_URL=https://62.171.177.212:8443

# DESPUÉS (con dominio real)
VITE_LOGIC_API_URL=https://tu-dominio.com/api
VITE_TRADING_API_URL=https://tu-dominio.com:8443
```

#### **Archivos a actualizar:**
1. `C:\Users\Administrator\Desktop\broker\broker_agm\.env.production`
2. `C:\Users\Administrator\Desktop\broker\copy-pamm\.env.production`
3. `C:\nginx\nginx-1.24.0\conf\nginx.conf`

### 3. **Configuración de Nginx con Dominio**

```nginx
# C:\nginx\nginx-1.24.0\conf\nginx.conf

server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    # Proxy para Copy-PAMM API
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend estático (si lo sirves desde Nginx)
    location / {
        root C:\Users\Administrator\Desktop\broker\broker_agm\dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. **Actualización del Backend Copy-PAMM**

```javascript
// C:\Users\Administrator\Desktop\broker\copy-pamm\.env.production

# CORS Origins (agregar tu dominio)
FRONTEND_URL=https://tu-dominio.com
ADMIN_URL=https://admin.tu-dominio.com
```

### 5. **Scripts de Deployment**

#### **Build del Frontend:**
```bash
cd C:\Users\Administrator\Desktop\broker\broker_agm
npm run build
```

#### **Restart de Servicios:**
```bash
# Reiniciar PM2
pm2 restart copy-pamm-enterprise

# Reiniciar Nginx
powershell -c "Stop-Process -Name nginx -Force; Set-Location 'C:\nginx\nginx-1.24.0'; Start-Process -FilePath '.\nginx.exe'"
```

## 🔄 PROCESO DE ACTUALIZACIÓN DE DOMINIO

### **PASO 1: Actualizar Variables de Entorno**
```bash
# Editar .env.production
VITE_LOGIC_API_URL=https://tu-dominio.com/api
VITE_TRADING_API_URL=https://tu-dominio.com:8443
```

### **PASO 2: Rebuild Frontend**
```bash
npm run build
```

### **PASO 3: Actualizar Nginx**
```bash
# Editar nginx.conf con tu dominio
server_name tu-dominio.com;
```

### **PASO 4: Configurar SSL**
```bash
# Usando win-acme o certbot
certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com
```

### **PASO 5: Restart Todo**
```bash
pm2 restart all
# Restart Nginx
```

## 🔒 CONFIGURACIÓN SSL CON LET'S ENCRYPT

### **Opción A: Win-ACME (Windows)**
```powershell
# Ya tienes win-acme instalado en C:\win-acme
cd C:\win-acme
wacs.exe --target manual --host tu-dominio.com --store pemfiles --pemfilespath C:\nginx\ssl
```

### **Opción B: Certbot (Windows)**
```bash
# Ya tienes Certbot instalado en C:\Certbot
certbot certonly --standalone -d tu-dominio.com --config-dir C:\certbot-credentials
```

## 📱 CONFIGURACIÓN DE CORS

### **Backend (Copy-PAMM API):**
```javascript
// Ya configurado en server.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com', 'https://www.tu-dominio.com']
    : true,
  credentials: true
}));
```

### **MT5 API (Python):**
```python
# Actualizar en tu API de Python
CORS_ORIGINS = [
    "https://tu-dominio.com",
    "https://www.tu-dominio.com"
]
```

## 🎯 COMANDOS RÁPIDOS

```bash
# Ver status de todas las APIs
pm2 status

# Ver logs
pm2 logs copy-pamm-enterprise

# Rebuild frontend con producción
npm run build

# Test SSL
curl https://tu-dominio.com/api/health
```

## ⚠️ IMPORTANTE

1. **SIEMPRE** haz backup antes de cambiar configuración
2. **PRIMERO** prueba en desarrollo local
3. **DESPUÉS** aplica cambios en producción
4. **MANTÉN** los logs activos durante el deployment

## 📞 SOPORTE

Si necesitas ayuda durante el deployment:
1. Revisa los logs: `pm2 logs`
2. Verifica certificados SSL: `openssl s_client -connect tu-dominio.com:443`
3. Test endpoints: `curl https://tu-dominio.com/api/health`