# SMOKELESSLESS

This is a static website project designed to help with smoking cessation using a gamified approach. The site includes:

- **Index Page**: The main landing page.
- **Games Page**: A section for interactive games.
- **Styles**: Custom CSS for styling the application.

## Deployment on Oracle Cloud Infrastructure (OCI)

This guide explains how to host this static website on an Oracle Cloud Infrastructure (OCI) Compute Instance using the Nginx web server.

### Prerequisites

1.  **OCI Account**: You need an active Oracle Cloud account.
2.  **SSH Key Pair**: You will need an SSH public key for the instance creation and the private key to connect to it.

### Step 1: Create a Compute Instance

1.  Log in to the **OCI Console**.
2.  Navigate to **Compute** -> **Instances**.
3.  Click **Create Instance**.
4.  **Name**: Give your instance a name (e.g., `smokeless-web`).
5.  **Image and Shape**:
    - You can use the default **Oracle Linux** or **Ubuntu** image (this guide assumes Oracle Linux 8/9).
    - Choose a shape (e.g., _VM.Standard.E2.1.Micro_ for the Always Free tier).
6.  **Networking**: Select an existing Virtual Cloud Network (VCN) or create a new one. Ensure it has a public subnet.
7.  **Add SSH Keys**: Upload your public SSH key file (`.pub`) or paste the key contents.
8.  Click **Create**. Wait for the instance state to turn **Running** and note down its **Public IP address**.

### Step 2: Configure Security List (Firewall)

To allow traffic to your website, you must open port 80 (HTTP).

1.  In the instance details page, click on the **Subnet** link under "Primary VNIC".
2.  Click on the **Security List** for your subnet (e.g., `Default Security List...`).
3.  Click **Add Ingress Rules**.
4.  **Source CIDR**: `0.0.0.0/0` (Allows access from anywhere).
5.  **IP Protocol**: `TCP`.
6.  **Destination Port Range**: `80`.
7.  Click **Add Ingress Rules**.

### Step 3: Connect to the Instance

Open your terminal (or PowerShell) and connect via SSH using your private key:

```bash
ssh -i /path/to/your/private_key opc@<YOUR_INSTANCE_PUBLIC_IP>
```

_(Note: If using Ubuntu, the username is usually `ubuntu` instead of `opc`)_

### Step 4: Install and Start Nginx

Once connected to the server, install the Nginx web server.

```bash
# Update package lists
sudo dnf update -y

# Install Nginx
sudo dnf install nginx -y

# Enable Nginx to start on boot and start it now
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure local firewall (firewalld) to allow HTTP traffic associated with Nginx
sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --reload
```

### Step 5: Upload Project Files

You need to move your `index.html`, `games.html`, and `styles.css` to the server. You can use `scp` (Secure Copy) from your local machine.

Run this **on your local machine** (not inside the SSH session):

```bash
scp -i /path/to/your/private_key index.html games.html styles.css opc@<YOUR_INSTANCE_PUBLIC_IP>:~/
```

### Step 6: Deploy Files to Nginx Directory

Go back to your **SSH session** on the server. Move the files to the default Nginx root directory (`/usr/share/nginx/html`).

```bash
# Backup original index.html (optional)
sudo mv /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html.bak

# Move your files
sudo mv ~/index.html /usr/share/nginx/html/
sudo mv ~/games.html /usr/share/nginx/html/
sudo mv ~/styles.css /usr/share/nginx/html/

# Fix permissions (ensure they are readable)
sudo chmod 644 /usr/share/nginx/html/*
sudo chown root:root /usr/share/nginx/html/*
```

### Step 7: Access Your Site

Open your web browser and go to:
`http://<YOUR_INSTANCE_PUBLIC_IP>`

You should see your **Smokelessless** website running live!
