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
