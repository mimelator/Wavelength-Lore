# FX Validation Testing Suite

This directory contains comprehensive tests for validating image effects processing, particularly focusing on border implementation and pipeline compatibility.

## Test Files

### `pipeline-test.js`
- **Purpose**: Tests the complete Printify pipeline with border tracking
- **Steps**: Original → Upscaled → FX Applied → Rescaled for Printify
- **Focus**: Validates that borders survive the complete processing pipeline
- **Output**: Step-by-step images showing border preservation

### `validation-suite.js`
- **Purpose**: Comprehensive FX processing validation framework
- **Tests**:
  1. Border Processing Deep Dive
  2. Effects Chain Validation  
  3. Dimension Preservation
  4. Image Quality Assessment
  5. Pipeline Compatibility
- **Output**: Detailed validation report with pass/fail results

## Usage

### Run Pipeline Test
```bash
node tests/fx-validation/pipeline-test.js
```

### Run Complete Validation Suite
```bash
node tests/fx-validation/validation-suite.js
```

## Output Directories

- `tests/fx-validation/output/pipeline-test/` - Pipeline test step-by-step images
- `tests/fx-validation/output/validation-suite/` - Comprehensive validation results

## Key Validation Points

- ✅ **Borders preserved through upscaling**
- ✅ **Dimensions maintained (inset borders)**
- ✅ **Border visibility across different sizes**
- ✅ **Effects chain compatibility**
- ✅ **Image quality preservation**

These tests confirm that the border implementation works correctly through all processing stages and is ready for production use.