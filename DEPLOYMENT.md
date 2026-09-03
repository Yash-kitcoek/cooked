# Deployment Guide (Oracle Cloud)

This guide covers deploying the GIOP stack (FastAPI, React/Vite, PostgreSQL, Redis) on an Oracle Cloud VM using Docker Compose and Caddy for HTTPS.

## 1. Prerequisites

- Oracle Cloud VM (Ubuntu 22.04+ recommended)
- Port 80 (HTTP) and 443 (HTTPS) open in the Oracle Cloud VCN Security List and OS firewall (iptables/ufw).
- Docker and Docker Compose installed on the VM.
- A domain name. We will use `sslip.io` (a free wildcard DNS service) for easy setup if you don't have a custom domain.

## 2. Server Setup

SSH into your Oracle Cloud VM:
```bash
ssh -i <your-ssh-key> ubuntu@<your-vm-ip>
```

Clone the repository:
```bash
git clone https://github.com/siddhantgosavi7/SIH-2026.git
cd SIH-2026
```

## 3. Environment Configuration

Copy the example environment file:
```bash
cp api/api/.env.example api/api/.env
```

Edit `api/api/.env` and update the following values:
```ini
# Replace <your-vm-ip> with the actual public IP of your VM
ALLOWED_ORIGINS=https://<your-vm-ip>.sslip.io

# Generate a strong, random 32+ character string
JWT_SECRET=YOUR_SUPER_SECRET_KEY_HERE

# Define admin credentials
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strongpassword123
```

## 4. Caddy Reverse Proxy Configuration

We use Caddy to automatically handle HTTPS certificates and route traffic to the frontend and backend containers.

Create a file named `Caddyfile` in the root of the repository:

```caddyfile
# Replace <your-vm-ip> with the actual public IP of your VM
<your-vm-ip>.sslip.io {
    # Route /api traffic to the FastAPI backend (running on port 8000)
    route /api/* {
        uri strip_prefix /api
        reverse_proxy api:8000
    }

    # Route /docs traffic to the FastAPI docs
    route /docs* {
        reverse_proxy api:8000
    }

    # Route /openapi.json to the FastAPI OpenAPI schema
    route /openapi.json {
        reverse_proxy api:8000
    }

    # Route everything else to the Vite frontend (running on port 5173)
    # Note: Vite uses a dev server, for production you'd normally serve the static dist folder
    route /* {
        reverse_proxy web:5173
    }
}
```

Update `docker-compose.yml` to include the Caddy service. Add the following under `services:`:

```yaml
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api
      - web
```
And add `caddy_data` and `caddy_config` to your `volumes:` block at the end of `docker-compose.yml`:
```yaml
volumes:
  postgres_data:
  caddy_data:
  caddy_config:
```

## 5. Build and Deploy

In the `SIH-2026` directory, run:
```bash
docker compose up -d --build
```

Verify everything is running:
```bash
docker compose ps
```

## 6. Accessing the Application

Wait a minute for Caddy to provision the SSL certificates from Let's Encrypt. Then access:

- **Frontend:** `https://<your-vm-ip>.sslip.io`
- **API Docs:** `https://<your-vm-ip>.sslip.io/docs`

## 7. Seeding Initial Data

Run the seed scripts to populate demo data:
```bash
docker compose exec api python seed_staff.py
docker compose exec api python seed_demo_problems.py
docker compose exec api python seed_demo_complaints.py
```

## Troubleshooting

- **Caddy failing to provision SSL:** Ensure ports 80 and 443 are open in the Oracle Cloud VCN Security Rules *and* on the Ubuntu VM firewall (run `sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT` and `sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT`).
- **CORS Errors:** Make sure the frontend URL (e.g., `https://<your-vm-ip>.sslip.io`) exactly matches what is in `ALLOWED_ORIGINS` in `api/api/.env`.
