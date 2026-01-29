# File Upload Test Instructions

## Testing the File Upload Feature

1. **Access the Upload Page:**
   - Navigate to: `/admin/products/[your-product-id]/versions/new`
   - Login as admin if required

2. **Test File Upload:**
   - Click "Upload JAR File" area or drag & drop a .jar file
   - File should be validated (type: .jar, size: <50MB)
   - Progress indicator should show upload status
   - Once uploaded, the form fields for URL and file size should disappear

3. **Submit Version:**
   - Fill in version number (e.g., 1.0.0)
   - Add changelog if desired
   - Set compatibility options
   - Choose version flags
   - Click "Create Version"

4. **Expected Results:**
   - File should be saved to `/public/plugins/` directory
   - Database should contain new version entry with file URL
   - Redirect to versions list should occur
   - No "Body exceeded limit" error should appear

## Configuration Changes Made

- Updated `next.config.ts` with `bodySizeLimit: '50mb'`
- Added server action `handleFileUpload` in `/lib/file-actions.ts`
- Enhanced error handling and validation
- Improved file naming with timestamps and random strings

## Files Modified

1. `next.config.ts` - Added serverActions bodySizeLimit
2. `src/lib/file-actions.ts` - Server-side file upload logic
3. `src/components/ui/FileUpload.tsx` - Upload UI component
4. `src/app/admin/products/[id]/versions/new/` - Version creation forms