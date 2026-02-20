# OCR System Implementation

This document outlines the Optical Character Recognition (OCR) system implemented for the Sehat Safe application.

## Overview

The system allows users to upload prescription images (JPG, PNG) or PDFs. The OCR processing is handled **server-side** to ensure robust processing and separation of concerns, without relying on external AI services like Gemini or Google Vision.

## Architecture

### 1. Frontend (Client)
- **File Upload**: User selects a file in `PrescriptionUpload.tsx`.
- **Persistence**: The file is immediately uploaded to **Firebase Cloud Storage** using `storageService.ts` to ensure it is safely stored and a download URL is generated.
- **Processing Request**: The original file is sent to the backend endpoint `/api/process-prescription` via a `POST` request (multipart/form-data).

### 2. Backend (Server)
The backend (Node.js/Express) handles the heavy lifting:
- **Endpoint**: `/api/process-prescription`
- **OCR Engine**: We utilize **Tesseract.js** running in the Node.js environment.
- **Processing Flow**:
  1. Receives the file buffer from the request.
  2. Runs Tesseract OCR (`eng` language) on the buffer.
  3. Extracts raw text.
  4. Parses the text using **Server-Side Heuristics (Regex)** to identify:
     - **Doctor Name** (e.g., "Dr. John Doe")
     - **Diagnosis** (e.g., "Diagnosis: Fever")
     - **Medicines** (e.g., "500mg Paracetamol")
  5. Returns a structured JSON response to the frontend.

### 3. Data Sync
- The frontend receives the analysis and combines it with the Firebase Storage URL.
- The complete `Prescription` object is saved to the application's data service (`localStorage`) and/or Firestore for the user's dashboard.

## Key Decisions
- **No External AI**: We replaced Gemini/Vision API with a self-hosted Tesseract instance on the server.
- **Privacy**: Processing happens on our own server instance.
- **Reliability**: Server-side processing avoids browser performance issues with large WASM binaries.

## Code Location
- **Frontend UI**: `src/components/Patient/PrescriptionUpload.tsx`
- **Storage Service**: `src/services/storageService.ts` (Handles Firebase Uploads)
- **Backend Controller**: `server/src/controllers/prescriptionController.ts` (Handles OCR Logic)
