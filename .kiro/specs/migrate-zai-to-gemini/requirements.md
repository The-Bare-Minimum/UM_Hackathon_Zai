# Requirements Document

## Introduction

This document specifies the requirements for migrating the AI integration from Z.ai (ilmu-glm-5.1 model) to Google Gemini AI. The migration will replace the existing Z.ai client library with a Google Gemini AI client while maintaining the same functionality for text completions and vision tasks. The system currently uses Z.ai in two active API routes (insights and cost-alerts) and has three placeholder routes for future Phase 1 implementation.

## Glossary

- **Gemini_Client**: The new Google Gemini AI client library that will replace the Z.ai client
- **AI_Route**: An API endpoint in src/app/api/ai/ that uses AI capabilities
- **Text_Completion**: AI-generated text response based on a prompt and conversation history
- **Vision_Task**: AI analysis of images combined with text prompts
- **Environment_Variable**: Configuration value stored in .env.local file
- **API_Key**: Authentication credential for accessing the Gemini API
- **Message_Interface**: The data structure for conversation messages (role and content)
- **Cache**: In-memory storage for AI responses to reduce API calls

## Requirements

### Requirement 1: Replace Z.ai Client with Gemini Client

**User Story:** As a developer, I want to replace the Z.ai client with a Google Gemini AI client, so that the application uses Google's AI services instead of Z.ai.

#### Acceptance Criteria

1. THE Gemini_Client SHALL be implemented in a new file at src/lib/gemini/client.ts
2. THE Gemini_Client SHALL provide a function for text completions that accepts messages and options
3. THE Gemini_Client SHALL provide a function for vision tasks that accepts a prompt, image data, and mime type
4. THE Gemini_Client SHALL use the official Google Gen AI SDK (@google/genai package)
5. THE Gemini_Client SHALL authenticate using the GEMINI_API_KEY environment variable
6. WHEN the Gemini_Client receives a request, THE Gemini_Client SHALL format messages according to Gemini's API requirements
7. WHEN the Gemini API returns an error, THE Gemini_Client SHALL throw an error with a descriptive message
8. THE Gemini_Client SHALL support temperature and max_tokens configuration options
9. THE Gemini_Client SHALL use the gemma-4-26b-a4b-it model for text completions
10. THE Gemini_Client SHALL use the gemma-4-26b-a4b-it model for vision tasks

### Requirement 2: Update Environment Variables

**User Story:** As a developer, I want to update environment variables, so that the application uses Gemini API credentials instead of Z.ai credentials.

#### Acceptance Criteria

1. THE Environment_Variable ZAI_API_KEY SHALL be removed from .env.local
2. THE Environment_Variable ZAI_API_BASE_URL SHALL be removed from .env.local
3. THE Environment_Variable GEMINI_API_KEY SHALL be added to .env.local
4. THE Environment_Variable GEMINI_API_KEY SHALL be added to .env.example with a placeholder value
5. WHEN .env.example is updated, THE System SHALL include a comment explaining where to obtain a Gemini API key

### Requirement 3: Update Active AI Routes

**User Story:** As a developer, I want to update the active AI routes to use Gemini, so that the insights and cost-alerts features work with the new AI provider.

#### Acceptance Criteria

1. THE AI_Route at src/app/api/ai/insights/route.ts SHALL import from @/lib/gemini/client instead of @/lib/zai/client
2. THE AI_Route at src/app/api/ai/cost-alerts/route.ts SHALL import from @/lib/gemini/client instead of @/lib/zai/client
3. WHEN an AI_Route calls the Gemini_Client, THE AI_Route SHALL use the same message format as before
4. WHEN an AI_Route receives a response from Gemini_Client, THE AI_Route SHALL process it in the same way as Z.ai responses
5. THE Cache mechanism in each AI_Route SHALL continue to function without modification
6. WHEN the insights route generates an insight, THE System SHALL return the same JSON structure as before
7. WHEN the cost-alerts route generates alerts, THE System SHALL return the same JSON structure as before

### Requirement 4: Remove Z.ai Dependencies

**User Story:** As a developer, I want to remove Z.ai dependencies, so that the codebase is clean and only contains necessary code.

#### Acceptance Criteria

1. THE file src/lib/zai/client.ts SHALL be deleted
2. THE directory src/lib/zai SHALL be deleted if empty
3. WHEN all Z.ai code is removed, THE System SHALL have no remaining imports from @/lib/zai/client
4. WHEN all Z.ai code is removed, THE System SHALL have no remaining references to ZAI_API_KEY or ZAI_API_BASE_URL in TypeScript files

### Requirement 5: Install Gemini SDK

**User Story:** As a developer, I want to install the Google Generative AI SDK, so that the application can communicate with Gemini API.

#### Acceptance Criteria

1. THE package @google/genai SHALL be added to package.json dependencies
2. WHEN the package is installed, THE System SHALL use npm to install @google/genai
3. THE package.json SHALL be updated with the latest stable version of @google/genai

### Requirement 6: Maintain API Compatibility

**User Story:** As a developer, I want to maintain the same API interface, so that existing code using the AI client continues to work without changes.

#### Acceptance Criteria

1. THE Gemini_Client SHALL export a function with the same signature as callZai
2. THE Gemini_Client SHALL export a function with the same signature as callZaiWithImage
3. THE Message_Interface SHALL remain unchanged (role: 'system' | 'user' | 'assistant', content: string)
4. WHEN an AI_Route calls the text completion function, THE function SHALL accept an array of messages and an options object
5. WHEN an AI_Route calls the vision function, THE function SHALL accept a prompt string, base64 image data, and mime type
6. THE options object SHALL support temperature and max_tokens parameters
7. WHEN temperature is not provided, THE Gemini_Client SHALL use a default value of 0.7
8. WHEN max_tokens is not provided, THE Gemini_Client SHALL use a default value of 1000

### Requirement 7: Handle Gemini-Specific Response Format

**User Story:** As a developer, I want to handle Gemini's response format correctly, so that the application extracts text content properly from API responses.

#### Acceptance Criteria

1. WHEN the Gemini API returns a response, THE Gemini_Client SHALL extract the text content from the response
2. THE Gemini_Client SHALL return a string containing the generated text
3. IF the Gemini API response is empty, THEN THE Gemini_Client SHALL throw an error
4. WHEN the Gemini_Client processes a vision response, THE Gemini_Client SHALL extract text content in the same way as text completions

### Requirement 8: Preserve Error Handling

**User Story:** As a developer, I want error handling to work consistently, so that API failures are caught and reported properly.

#### Acceptance Criteria

1. WHEN the Gemini API returns an HTTP error, THE Gemini_Client SHALL throw an error with the status code
2. WHEN the Gemini_Client throws an error, THE error message SHALL include "Gemini API error" for identification
3. WHEN an AI_Route catches an error from Gemini_Client, THE AI_Route SHALL log the error to the console
4. WHEN an AI_Route catches an error from Gemini_Client, THE AI_Route SHALL return a 500 status code with an error message
5. THE error handling behavior SHALL be identical to the previous Z.ai implementation

### Requirement 9: Support Multimodal Content

**User Story:** As a developer, I want to support Gemini's multimodal capabilities, so that vision tasks can be implemented for future Phase 1 features.

#### Acceptance Criteria

1. THE Gemini_Client vision function SHALL convert base64 image data to the format required by Gemini API
2. WHEN the vision function receives an image, THE Gemini_Client SHALL create a multimodal prompt with both image and text
3. THE Gemini_Client SHALL support JPEG, PNG, and WebP image formats
4. WHEN an unsupported mime type is provided, THE Gemini_Client SHALL throw an error with a descriptive message

### Requirement 10: Verify Migration Success

**User Story:** As a developer, I want to verify the migration works correctly, so that I can confirm the AI features function as expected with Gemini.

#### Acceptance Criteria

1. WHEN the insights API is called with valid business data, THE System SHALL return an insight generated by Gemini
2. WHEN the cost-alerts API is called with valid business data, THE System SHALL return alerts generated by Gemini
3. THE response format from both APIs SHALL match the format used before migration
4. WHEN the Gemini_Client is called with the same inputs as Z.ai, THE response quality SHALL be comparable or better
5. THE System SHALL successfully compile with no TypeScript errors after migration
