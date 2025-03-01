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
