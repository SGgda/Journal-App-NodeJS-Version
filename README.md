# Journal App Deployment Guide

Here is your lightweight, functional CRUD Journal application!

## How to Set Up and Run

### 1. Local Development (Docker Compose)
To run the app locally without deploying to AWS yet:
1. Create a `.env` file in the `backend/` directory with your Supabase credentials:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   PORT=5000
   REDIS_URL=redis://redis:6379
   ```
2. Run `docker-compose up --build` from the root directory.
3. Access the frontend at `http://localhost:3000`.

### 2. Infrastructure Deployment (Terraform)
To deploy the EC2 instance running K3s (Lightweight Kubernetes):
1. Navigate to the `terraform/` directory.
2. Initialize Terraform: `terraform init`
3. Plan and apply: `terraform apply -var="key_name=your-aws-ssh-key-name"`
4. Once applied, Terraform will output the `public_ip` of your new EC2 instance. Wait a few minutes for K3s to finish installing via the user_data script.

### 3. Application Deployment (Kubernetes)
1. SSH into your EC2 instance: `ssh -i path-to-key.pem ubuntu@<EC2-PUBLIC-IP>`
2. Verify K3s is running: `sudo k3s kubectl get nodes`
3. Update `k8s/frontend-deployment.yaml` with the public IP of your EC2 instance so the frontend knows where the backend API is.
4. Apply secrets for Supabase:
   ```bash
   kubectl create secret generic app-secrets \
     --from-literal=SUPABASE_URL='your-supabase-url' \
     --from-literal=SUPABASE_KEY='your-supabase-key'
   ```
5. Apply the Kubernetes manifests: `kubectl apply -f k8s/`
6. Access your app!
   - Frontend: `http://<EC2-PUBLIC-IP>:30000`
   - Backend API: `http://<EC2-PUBLIC-IP>:30005`

### 4. CI/CD (Jenkins)
The provided `Jenkinsfile` automate the building and deploying process. You will need to configure the following credentials in your Jenkins server:
- `dockerhub-creds`: Username and password for your Docker Hub account.
- `kubeconfig`: A Secret file containing the kubeconfig of your K3s cluster (found at `/home/ubuntu/.kube/config` on the EC2 instance).

### Important Database Note
Make sure your Supabase project has a table named `journals` with the following schema:
- `id` (uuid, primary key)
- `title` (text)
- `content` (text)
- `created_at` (timestamp, default: now())

Also, ensure Row Level Security (RLS) is configured to allow public operations, or configure policies if you want restrictions.
