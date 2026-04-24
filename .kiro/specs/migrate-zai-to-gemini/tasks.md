# Implementation Plan: Migrate Z.ai to Google Gemini AI

## Overview

This implementation plan breaks down the migration from Z.ai to Google Gemini AI into discrete, actionable coding tasks. The migration follows a drop-in replacement pattern to minimize risk while maintaining full API compatibility with existing routes. Each task builds incrementally toward a complete, tested migration.

## Tasks

- [x] 1. Setup: Install Gemini SDK and configure environment
  - [x] 1.1 Install @google/genai package
    - Run `npm install @google/genai` to add the SDK
    - Verify package.json includes the dependency
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 1.2 Update environment variable configuration
    - Add `GEMINI_API_KEY` to `.env.example` with placeholder value and setup instructions
    - Add comment in `.env.example` explaining where to obtain API key (Google AI Studio)
    - Remove `ZAI_API_KEY` and `ZAI_API_BASE_URL` from `.env.local`
    - Add `GEMINI_API_KEY` to `.env.local` with actual API key
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Implement Gemini client module
  - [x] 2.1 Create client file structure and type definitions
    - Create `src/lib/gemini/client.ts` file
    - Define `GeminiMessage` interface with role and content properties
    - Define `GeminiOptions` interface with temperature, max_tokens, and stream properties
    - Export both interfaces for use in API routes
    - _Requirements: 1.1, 6.3_
  
  - [x] 2.2 Implement message format conversion logic
    - Create helper function to extract system instructions from messages array
    - Create helper function to convert messages to Gemini Content format
    - Map 'user' role to 'user' and 'assistant' role to 'model'
    - Wrap text content in parts array with text property
    - Handle empty messages array edge case
    - _Requirements: 1.6_
  
  - [x] 2.3 Implement callGemini function for text completions
    - Initialize GoogleGenAI client with GEMINI_API_KEY from environment
    - Get gemma-4-26b-a4b-it model instance
    - Apply default values: temperature=0.7, max_tokens=1000
    - Convert max_tokens to maxOutputTokens for Gemini API
    - Extract system instruction and convert messages to Gemini format
    - Call generateContent with converted messages and configuration
    - Extract text from response candidates
    - Throw descriptive error if response is empty or API fails
    - Return generated text string
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 6.1, 6.4, 6.6, 6.7, 7.1, 7.2, 7.3, 8.1, 8.2_
  
  - [x] 2.4 Implement callGeminiWithImage function for vision tasks
    - Initialize GoogleGenAI client with GEMINI_API_KEY
    - Get gemma-4-26b-a4b-it model instance
    - Validate mimeType against supported formats (image/jpeg, image/png, image/webp)
    - Throw descriptive error for unsupported MIME types
    - Create inline data part with mimeType and base64 image data
    - Combine text prompt and image data in parts array
    - Call generateContent with multimodal content
    - Extract text from response candidates
    - Throw descriptive error if response is empty or API fails
    - Return generated text string
    - _Requirements: 1.3, 1.10, 6.2, 6.5, 7.4, 8.1, 8.2, 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 2.5 Write unit tests for Gemini client
    - Test message format conversion (system instruction extraction, role mapping)
    - Test default configuration values (temperature, max_tokens)
    - Test error handling (missing API key, empty response, unsupported MIME types)
    - Test vision task inline data part creation
    - Mock @google/generative-ai SDK for isolated testing
    - _Requirements: 1.6, 1.7, 6.6, 6.7, 8.1, 8.2, 9.4_

- [x] 3. Checkpoint - Verify Gemini client implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update API routes to use Gemini client
  - [x] 4.1 Update insights API route
    - Change import from `@/lib/zai/client` to `@/lib/gemini/client`
    - Rename `callZai` function calls to `callGemini`
    - Verify message format remains unchanged
    - Verify cache mechanism continues to work
    - Verify error handling remains unchanged (console.error and 500 response)
    - Verify response JSON structure remains unchanged
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 6.1, 6.4, 8.3, 8.4, 8.5_
  
  - [x] 4.2 Update cost-alerts API route
    - Change import from `@/lib/zai/client` to `@/lib/gemini/client`
    - Rename `callZai` function calls to `callGemini`
    - Verify message format remains unchanged
    - Verify cache mechanism continues to work
    - Verify error handling remains unchanged (console.error and 500 response)
    - Verify response JSON structure remains unchanged
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.7, 6.1, 6.4, 8.3, 8.4, 8.5_
  
  - [ ]* 4.3 Write integration tests for updated routes
    - Test `/api/ai/insights` returns valid insight with Gemini
    - Test `/api/ai/cost-alerts` returns valid alerts array with Gemini
    - Test cache mechanism reduces API calls
    - Test error responses return 500 status with proper error messages
    - Verify response format matches pre-migration format
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 5. Remove Z.ai dependencies and code
  - [x] 5.1 Delete Z.ai client code
    - Delete `src/lib/zai/client.ts` file
    - Delete `src/lib/zai` directory if empty
    - _Requirements: 4.1, 4.2_
  
  - [x] 5.2 Verify no remaining Z.ai references
    - Search codebase for imports from `@/lib/zai/client`
    - Search codebase for references to `ZAI_API_KEY` in TypeScript files
    - Search codebase for references to `ZAI_API_BASE_URL` in TypeScript files
    - Confirm no remaining references exist
    - _Requirements: 4.3, 4.4_
  
  - [x] 5.3 Run TypeScript compilation check
    - Run `npm run build` to verify no compilation errors
    - Fix any TypeScript errors if they arise
    - _Requirements: 10.5_

- [x] 6. Checkpoint - Verify migration completeness
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Manual testing and verification
  - [x] 7.1 Test insights API with sample data
    - Call `/api/ai/insights` with valid business data
    - Verify response contains relevant business insight
    - Verify response format matches pre-migration format
    - Compare response quality with Z.ai baseline
    - _Requirements: 10.1, 10.3, 10.4_
  
  - [x] 7.2 Test cost-alerts API with sample data
    - Call `/api/ai/cost-alerts` with valid business data
    - Verify response contains properly formatted alerts array
    - Verify response format matches pre-migration format
    - Compare response quality with Z.ai baseline
    - _Requirements: 10.2, 10.3, 10.4_
  
  - [x] 7.3 Test error scenarios
    - Test with invalid/missing GEMINI_API_KEY (expect descriptive error)
    - Test with network errors (expect 500 response)
    - Verify error messages are logged to console
    - Verify error responses are properly formatted
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 8. Update documentation
  - [x] 8.1 Update README with Gemini setup instructions
    - Document GEMINI_API_KEY environment variable requirement
    - Add instructions for obtaining API key from Google AI Studio
    - Remove references to Z.ai configuration
    - Add migration notes for future reference
    - _Requirements: 2.5_

- [x] 9. Final checkpoint - Complete migration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The migration maintains full API compatibility with existing routes
- No breaking changes to consuming code
- Cache mechanisms and error handling remain unchanged
- TypeScript compilation must pass before considering migration complete
