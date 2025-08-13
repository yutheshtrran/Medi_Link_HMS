import os
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader

# ==== Paths ==== 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(BASE_DIR, 'data/images')  # Correct relative path to images
save_dir = os.path.abspath(os.path.join(BASE_DIR, '../../ml_model/saved-model'))
os.makedirs(save_dir, exist_ok=True)
save_path = os.path.join(save_dir, 'cv_model.pth')

# ==== Validate data path ====
if not os.path.exists(data_dir):
    raise FileNotFoundError(f"❌ Dataset path not found: {data_dir}")
print(f"📂 Using dataset from: {data_dir}")

# ==== Image Transforms ====
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

# ==== Dataset and DataLoader ====
dataset = datasets.ImageFolder(root=data_dir, transform=transform)
loader = DataLoader(dataset, batch_size=16, shuffle=True)
class_names = dataset.classes
print(f"📦 Found {len(class_names)} classes: {class_names}")

# ==== Model Setup ====
model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, len(class_names))
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# ==== Training Loop ====
print("🚀 Starting training...")
model.train()
for epoch in range(5):
    running_loss = 0.0
    for imgs, labels in loader:
        optimizer.zero_grad()
        outputs = model(imgs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
    print(f"📈 Epoch {epoch+1}/5 - Loss: {running_loss / len(loader):.4f}")

# ==== Save Model ====
torch.save({
    'model_state_dict': model.state_dict(),
    'class_names': class_names
}, save_path)

print(f"✅ CV model trained and saved at: {save_path}")
