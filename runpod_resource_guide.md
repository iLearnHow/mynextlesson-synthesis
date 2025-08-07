# 🚀 RunPod Complete Setup Guide - Voice Training Project

## 📋 Overview
This guide will walk you through setting up RunPod from Cursor to execute your Kelly and Ken voice training project. Total budget: $50 for both models ($25 each for 24-hour training sessions).

---

## 🏁 Quick Start Checklist

### Phase 1: Account Setup (5 minutes)
- [ ] Create RunPod account at [runpod.io](https://runpod.io)
- [ ] Add $50+ credits to account
- [ ] Generate API key with Read/Write permissions
- [ ] Install runpodctl CLI (optional but recommended)

### Phase 2: Kelly Voice Training (24 hours)
- [ ] Deploy RTX 4090 pod
- [ ] Upload kelly_runpod.sh + Kelly audio data
- [ ] Execute training script
- [ ] Monitor progress and download model

### Phase 3: Ken Voice Training (24 hours)
- [ ] Deploy RTX 3090 pod  
- [ ] Upload ken_runpod.sh + Ken audio data
- [ ] Execute training script
- [ ] Monitor progress and download model

---

## 🔑 Step 1: Account Setup & API Keys

### Create RunPod Account
1. Go to [runpod.io](https://runpod.io)
2. Click **"Sign Up"** → Use GitHub/Google or email
3. Verify your email address
4. Complete account setup

### Add Credits
1. Navigate to **Billing** in the console
2. Add **$50+** credits (covers both training sessions)
3. Payment methods: Credit card, PayPal, crypto

### Generate API Key
1. Go to **Settings** → **API Keys** section
2. Click **"Create API Key"**
3. Configure key settings:
   ```
   Name: "Voice Training Project"
   Permissions: "Read/Write" (full access)
   AI API: "Read/Write"
   GraphQL: "Read/Write"
   ```
4. **Copy and save the key immediately** (RunPod doesn't store it)

---

## 🛠️ Step 2: Install RunPod CLI (Optional)

### From Cursor Terminal:
```bash
# Install runpodctl
curl -fsSL https://github.com/runpod/runpodctl/releases/latest/download/runpodctl-linux-amd64 -o runpodctl
chmod +x runpodctl
sudo mv runpodctl /usr/local/bin/

# Verify installation
runpodctl version

# Configure with your API key
runpodctl config --apiKey YOUR_API_KEY_HERE
```

---

## 🎯 Step 3: Deploy Kelly Voice Training Pod (RTX 4090)

### Via Web Console:
1. Go to [console.runpod.io](https://console.runpod.io)
2. Click **"Deploy"** → **"GPU Pod"**
3. **Configure Pod:**
   ```
   GPU Type: RTX 4090 (24GB VRAM)
   vCPU: 8+ cores
   RAM: 32GB+
   Storage: 100GB+ Container Disk
   Container Image: pytorch/pytorch:latest
   Expose Ports: 8888 (Jupyter), 22 (SSH)
   ```
4. **Environment Variables:**
   ```bash
   JUPYTER_ENABLE_LAB=yes
   JUPYTER_TOKEN=your_secure_token
   ```
5. Click **"Deploy On Demand"**
6. **Expected Cost:** ~$1.04/hour = $25/24 hours

### Via API/CLI:
```bash
# Create Kelly training pod
curl -X POST "https://api.runpod.io/graphql" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { podFindAndDeployOnDemand(input: { cloudType: ALL, gpuCount: 1, volumeInGb: 100, containerDiskInGb: 100, minVcpuCount: 8, minMemoryInGb: 32, gpuTypeId: \"NVIDIA RTX 4090\", name: \"kelly-voice-training\", imageName: \"pytorch/pytorch:latest\", dockerArgs: \"\", ports: \"8888/http,22/tcp\", volumeMountPath: \"/workspace\", env: [{ key: \"JUPYTER_ENABLE_LAB\", value: \"yes\" }] }) { id costPerHr machine { podHostId } } }"
  }'
```

---

## 🎯 Step 4: Deploy Ken Voice Training Pod (RTX 3090)

### Via Web Console:
1. Go to [console.runpod.io](https://console.runpod.io)
2. Click **"Deploy"** → **"GPU Pod"**
3. **Configure Pod:**
   ```
   GPU Type: RTX 3090 (24GB VRAM)
   vCPU: 8+ cores
   RAM: 32GB+
   Storage: 100GB+ Container Disk
   Container Image: pytorch/pytorch:latest
   Expose Ports: 8888 (Jupyter), 22 (SSH)
   ```
4. **Environment Variables:**
   ```bash
   JUPYTER_ENABLE_LAB=yes
   JUPYTER_TOKEN=your_secure_token
   ```
5. Click **"Deploy On Demand"**
6. **Expected Cost:** ~$1.04/hour = $25/24 hours

---

## 📁 Step 5: File Upload & Training Execution

### Method 1: Jupyter Lab (Recommended)
1. **Access Pod:** Click **"Connect"** → **"Connect via HTTP [Port 8888]"**
2. **Upload Files:**
   - Open Jupyter Lab interface
   - Create `/workspace/kelly/` directory
   - Upload `kelly_runpod.sh` script
   - Upload Kelly audio dataset
3. **Execute Training:**
   ```bash
   cd /workspace/kelly
   chmod +x kelly_runpod.sh
   bash kelly_runpod.sh
   ```

### Method 2: SSH Access
1. **Get SSH Info:** From pod details page
2. **Connect:**
   ```bash
   ssh root@[POD_IP] -p [SSH_PORT]
   ```
3. **Upload via SCP:**
   ```bash
   scp -P [SSH_PORT] kelly_runpod.sh root@[POD_IP]:/workspace/
   scp -P [SSH_PORT] -r kelly_audio_data/ root@[POD_IP]:/workspace/
   ```

### Method 3: Web Terminal
1. Click **"Connect"** → **"Start Web Terminal"**
2. Use built-in file manager to upload
3. Execute scripts directly in terminal

---

## 📊 Step 6: Monitoring & Management

### Monitor Pod Status
```bash
# Via CLI
runpodctl get pod

# Via API
curl -X POST "https://api.runpod.io/graphql" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { myself { pods { id name runtime { uptimeInSeconds } } } }"}'
```

### Key Metrics to Watch:
- **GPU Utilization:** Should be 90%+ during training
- **Memory Usage:** Monitor VRAM usage
- **Training Loss:** Should decrease over time
- **Estimated Completion:** ~24 hours per model

### Stop/Start Pods:
```bash
# Stop pod (saves money)
runpodctl stop pod [POD_ID]

# Start pod
runpodctl start pod [POD_ID]

# Terminate pod (careful - destroys data!)
runpodctl remove pod [POD_ID]
```

---

## 💰 Cost Management

### Real-Time Cost Tracking:
- **RTX 4090:** ~$1.04/hour = $24.96/24 hours
- **RTX 3090:** ~$1.04/hour = $24.96/24 hours
- **Total Training Cost:** ~$50

### Cost Optimization Tips:
1. **Stop pods when not training** (saves compute but keeps storage)
2. **Use Spot instances** (50-80% cheaper, but can be interrupted)
3. **Monitor GPU utilization** (ensure >90% during training)
4. **Set spending limits** in billing settings

---

## 🔧 Training Scripts Template

### kelly_runpod.sh
```bash
#!/bin/bash
set -e

echo "🎤 Starting Kelly Voice Training on RunPod"
echo "GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader,nounits)"
echo "VRAM: $(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits) MB"

# Install dependencies
pip install piper-tts
pip install torch torchvision torchaudio

# Set up training environment
export CUDA_VISIBLE_DEVICES=0
export PIPER_MODEL_DIR="/workspace/models"
export PIPER_DATA_DIR="/workspace/datasets/kelly"

# Create directories
mkdir -p $PIPER_MODEL_DIR
mkdir -p $PIPER_DATA_DIR

# Copy training data
echo "📁 Preparing training data..."
cp -r kelly_audio_data/* $PIPER_DATA_DIR/

# Start training
echo "🚀 Starting training process..."
python -m piper_train \
    --dataset-dir $PIPER_DATA_DIR \
    --output-dir $PIPER_MODEL_DIR \
    --model-name kelly_voice \
    --batch-size 32 \
    --learning-rate 1e-4 \
    --max-epochs 1000 \
    --gpu-device 0

echo "✅ Kelly voice training completed!"
echo "📦 Model saved to: $PIPER_MODEL_DIR"
```

### ken_runpod.sh
```bash
#!/bin/bash
set -e

echo "🎤 Starting Ken Voice Training on RunPod"
echo "GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader,nounits)"
echo "VRAM: $(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits) MB"

# Install dependencies
pip install piper-tts
pip install torch torchvision torchaudio

# Set up training environment
export CUDA_VISIBLE_DEVICES=0
export PIPER_MODEL_DIR="/workspace/models"
export PIPER_DATA_DIR="/workspace/datasets/ken"

# Create directories
mkdir -p $PIPER_MODEL_DIR
mkdir -p $PIPER_DATA_DIR

# Copy training data
echo "📁 Preparing training data..."
cp -r ken_audio_data/* $PIPER_DATA_DIR/

# Start training
echo "🚀 Starting training process..."
python -m piper_train \
    --dataset-dir $PIPER_DATA_DIR \
    --output-dir $PIPER_MODEL_DIR \
    --model-name ken_voice \
    --batch-size 32 \
    --learning-rate 1e-4 \
    --max-epochs 1000 \
    --gpu-device 0

echo "✅ Ken voice training completed!"
echo "📦 Model saved to: $PIPER_MODEL_DIR"
```

---

## 📥 Step 7: Download Trained Models

### Via Jupyter Lab:
1. Navigate to `/workspace/models/` in Jupyter
2. Select trained model files
3. Right-click → Download
4. Save to local machine

### Via SCP:
```bash
# Download Kelly model
scp -P [SSH_PORT] -r root@[POD_IP]:/workspace/models/kelly_voice ./kelly_model/

# Download Ken model  
scp -P [SSH_PORT] -r root@[POD_IP]:/workspace/models/ken_voice ./ken_model/
```

### Via Web Interface:
1. Go to **Storage** → **Pod Storage**
2. Browse to model files
3. Click download button

---

## 🔍 Troubleshooting

### Common Issues:

#### Pod Won't Start
- **Check credits:** Ensure sufficient balance
- **GPU availability:** Try different GPU types
- **Region selection:** Try different data centers

#### Training Fails
```bash
# Check GPU status
nvidia-smi

# Check logs
tail -f /workspace/training.log

# Monitor system resources
htop
```

#### Upload Issues
- **File size limits:** Split large datasets
- **Network timeouts:** Use resumable uploads
- **Permission errors:** Check file permissions

#### Cost Overruns
- **Set spending alerts** in billing
- **Use spot instances** for 50-80% savings
- **Stop pods** when not actively training

---

## 📞 Support & Resources

### RunPod Support:
- **Documentation:** [docs.runpod.io](https://docs.runpod.io)
- **Discord Community:** [RunPod Discord](https://discord.gg/runpod)
- **Support Email:** support@runpod.io
- **Status Page:** status.runpod.io

### API References:
- **REST API:** [rest.runpod.io/v1/docs](https://rest.runpod.io/v1/docs)
- **GraphQL API:** [graphql-spec.runpod.io](https://graphql-spec.runpod.io)
- **Python SDK:** [github.com/runpod/runpod-python](https://github.com/runpod/runpod-python)

### Voice Training Resources:
- **Piper TTS:** [github.com/rhasspy/piper](https://github.com/rhasspy/piper)
- **Training Guides:** Community tutorials
- **Best Practices:** Model optimization tips

---

## ✅ Final Checklist

### Pre-Training:
- [ ] RunPod account created with $50+ credits
- [ ] API key generated and saved securely
- [ ] Training scripts (kelly_runpod.sh, ken_runpod.sh) prepared
- [ ] Audio datasets ready for upload
- [ ] Pod templates configured

### During Training:
- [ ] Monitor GPU utilization (>90%)
- [ ] Check training logs for errors
- [ ] Monitor credit usage
- [ ] Set completion notifications

### Post-Training:
- [ ] Download trained models
- [ ] Verify model quality
- [ ] Terminate pods to stop billing
- [ ] Document training metrics
- [ ] Prepare for avatar integration phase

---

## 🎯 Success Metrics

### Technical Success:
- [ ] Kelly model trains successfully (24 hours)
- [ ] Ken model trains successfully (24 hours)
- [ ] Models pass quality validation
- [ ] Total cost under $50
- [ ] No training interruptions

### Next Phase Ready:
- [ ] Models ready for avatar integration
- [ ] Cost tracking validated
- [ ] Timeline on track (1 week total)
- [ ] Ready for Phase 2: Avatar Integration ($30)

---

**📅 Timeline:** 48 hours (24 hours each model)  
**💰 Budget:** $50 total  
**🎯 Goal:** High-quality Kelly & Ken voice models  
**📈 ROI:** 8.5B students served at $0.0001/year  

---

*Last Updated: August 2, 2025*  
*Status: Ready for execution*