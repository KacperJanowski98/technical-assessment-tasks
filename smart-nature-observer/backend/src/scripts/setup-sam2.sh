#!/bin/bash

# Smart Nature Observer - SAM2 Setup Script
# This script sets up the SAM2 model for use with the Smart Nature Observer application

# Exit on error
set -e

# Get base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="$BASE_DIR/src/scripts"
MODEL_DIR="$BASE_DIR/models"
ENV_DIR="$BASE_DIR/venv"
SAM2_REPO_URL="https://github.com/facebookresearch/sam2"
SAM2_MODEL_URL="https://dl.fbaipublicfiles.com/segment_anything_2/sam2_l.pt"

echo "Setting up SAM2 model for Smart Nature Observer..."

# Create necessary directories
echo "Creating directories..."
mkdir -p "$MODEL_DIR"

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv "$ENV_DIR"
source "$ENV_DIR/bin/activate"

# Upgrade pip
pip install --upgrade pip

# Install required Python packages
echo "Installing required Python packages..."
pip install torch torchvision torchaudio
pip install opencv-python
pip install numpy

# Clone and install SAM2
echo "Cloning SAM2 repository..."
TMP_DIR=$(mktemp -d)
git clone "$SAM2_REPO_URL" "$TMP_DIR/sam2"
cd "$TMP_DIR/sam2"

# Install SAM2
echo "Installing SAM2..."
pip install -e .

# Download SAM2 model weights
echo "Downloading SAM2 model weights..."
curl -L "$SAM2_MODEL_URL" -o "$MODEL_DIR/sam2_l.pt"

# Create Python scripts for SAM2 integration
echo "Creating Python scripts for SAM2 integration..."

# Create script for automatic segmentation
cat > "$SCRIPTS_DIR/sam2_segment.py" << 'EOF'
#!/usr/bin/env python3

import argparse
import json
import os
import torch
import numpy as np
import cv2
from segment_anything_2 import sam2_model_registry, SamPredictor
from segment_anything_2.utils.amg import build_sam2_amg_predictor
import uuid

def main():
    parser = argparse.ArgumentParser(description="Run SAM2 automatic segmentation on an image")
    parser.add_argument("--image", type=str, required=True, help="Path to the input image")
    parser.add_argument("--model_path", type=str, required=True, help="Path to the SAM2 model weights")
    parser.add_argument("--output_dir", type=str, required=True, help="Directory to save output masks")
    args = parser.parse_args()
    
    # Load the image
    image = cv2.imread(args.image)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Load the SAM2 model
    predictor = build_sam2_amg_predictor(args.model_path)
    
    # Run automatic segmentation
    masks, scores, logits = predictor.predict(image)
    
    # Process the results
    result = {
        "masks": [],
        "labels": [],
        "confidence": []
    }
    
    label_map = {}
    
    for i, (mask, score) in enumerate(zip(masks, scores)):
        # Create a unique ID for this mask
        mask_id = str(uuid.uuid4())
        
        # Convert mask to contour points
        contours, _ = cv2.findContours(
            (mask * 255).astype(np.uint8), 
            cv2.RETR_EXTERNAL, 
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        # Skip masks with no contours
        if not contours:
            continue
            
        # Get the largest contour
        contour = max(contours, key=cv2.contourArea)
        
        # Simplify the contour
        epsilon = 0.005 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        # Convert to points
        points = []
        for point in approx:
            x, y = point[0]
            # Normalize coordinates to 0-100 range
            h, w = mask.shape
            points.append({
                "x": float(x) / w * 100,
                "y": float(y) / h * 100
            })
        
        # Skip masks with too few points
        if len(points) < 3:
            continue
        
        # Assign a color based on the index
        colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
        color = colors[i % len(colors)]
        
        # Simple label assignment based on position in the image
        # This is a placeholder - a real implementation would use a classifier
        h, w = mask.shape
        mask_indices = np.where(mask)
        center_y = np.mean(mask_indices[0]) / h
        center_x = np.mean(mask_indices[1]) / w
        
        if center_y < 0.3:
            label_name = "Sky"
        elif center_y > 0.7:
            label_name = "Ground"
        elif center_x < 0.3:
            label_name = "Tree"
        elif center_x > 0.7:
            label_name = "Mountain"
        else:
            label_name = "Object"
        
        # Store the mask
        result["masks"].append({
            "id": mask_id,
            "points": points,
            "color": color,
            "label": label_name,
            "visible": True
        })
        
        # Store the confidence
        result["confidence"].append(float(score))
        
        # Group masks by label
        if label_name not in label_map:
            label_map[label_name] = {
                "id": str(uuid.uuid4()),
                "name": label_name,
                "maskIds": []
            }
        
        label_map[label_name]["maskIds"].append(mask_id)
    
    # Add labels to result
    result["labels"] = list(label_map.values())
    
    # Print JSON result
    print(json.dumps(result))

if __name__ == "__main__":
    main()
EOF

# Create script for point-based segmentation
cat > "$SCRIPTS_DIR/sam2_point_segment.py" << 'EOF'
#!/usr/bin/env python3

import argparse
import json
import os
import torch
import numpy as np
import cv2
from segment_anything_2 import sam2_model_registry, SamPredictor
import uuid

def main():
    parser = argparse.ArgumentParser(description="Run SAM2 point-based segmentation on an image")
    parser.add_argument("--image", type=str, required=True, help="Path to the input image")
    parser.add_argument("--model_path", type=str, required=True, help="Path to the SAM2 model weights")
    parser.add_argument("--points", type=str, required=True, help="JSON string of points in format [{x: float, y: float}, ...]")
    parser.add_argument("--output_dir", type=str, required=True, help="Directory to save output masks")
    args = parser.parse_args()
    
    # Load the image
    image = cv2.imread(args.image)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    h, w = image.shape[:2]
    
    # Parse points
    points_json = json.loads(args.points)
    points = []
    for point in points_json:
        # Convert from 0-100 normalized range to pixel coordinates
        x = (point["x"] / 100) * w
        y = (point["y"] / 100) * h
        points.append([x, y])
    
    # Convert to numpy array
    points_np = np.array(points)
    
    # Load the SAM2 model
    sam2_model = sam2_model_registry["vit_l"](checkpoint=args.model_path)
    predictor = SamPredictor(sam2_model)
    
    # Set the image
    predictor.set_image(image)
    
    # Run point-based segmentation
    input_points = np.array(points_np)
    input_labels = np.ones(input_points.shape[0])  # All points are foreground
    
    masks, scores, logits = predictor.predict(
        point_coords=input_points,
        point_labels=input_labels,
        multimask_output=True
    )
    
    # Take the best mask
    best_mask_idx = np.argmax(scores)
    mask = masks[best_mask_idx]
    
    # Convert mask to contour points
    contours, _ = cv2.findContours(
        (mask * 255).astype(np.uint8), 
        cv2.RETR_EXTERNAL, 
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Process the result
    if not contours:
        # If no contours found, use the input points
        result_points = points_json
    else:
        # Get the largest contour
        contour = max(contours, key=cv2.contourArea)
        
        # Simplify the contour
        epsilon = 0.005 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        # Convert to points
        result_points = []
        for point in approx:
            x, y = point[0]
            # Normalize coordinates to 0-100 range
            result_points.append({
                "x": float(x) / w * 100,
                "y": float(y) / h * 100
            })
    
    # Create the result
    result = {
        "id": "",  # ID will be assigned by the backend
        "points": result_points,
        "color": "#ff0000",  # Default red color
        "visible": True
    }
    
    # Print JSON result
    print(json.dumps(result))

if __name__ == "__main__":
    main()
EOF

# Make the scripts executable
chmod +x "$SCRIPTS_DIR/sam2_segment.py"
chmod +x "$SCRIPTS_DIR/sam2_point_segment.py"

# Clean up
echo "Cleaning up..."
rm -rf "$TMP_DIR"

echo "SAM2 setup complete!"
echo "Model weights location: $MODEL_DIR/sam2_l.pt"
echo "Python virtual environment: $ENV_DIR"
echo "Activate the environment with: source $ENV_DIR/bin/activate"

# Deactivate the virtual environment
deactivate