import { analyzeContent } from '../ai';

describe('Medical note classification edge cases', () => {
  // Test case: Very short notes
  test('should handle very short notes correctly', async () => {
    const shortText = 'Kaszel.';
    const analysis = await analyzeContent(shortText);
    
    expect(analysis.medicalSections).toBeDefined();
    // Default assignment should be to Wywiad section
    expect(analysis.medicalSections!.Wywiad.length).toBe(1);
  });

  // Test case: Mixed language
  test('should handle text with mixed Polish and other languages', async () => {
    const mixedText = 'Patient has fever 38.5°C. Badanie: zaczerwieniona skóra.';
    const analysis = await analyzeContent(mixedText);
    
    expect(analysis.medicalSections).toBeDefined();
    expect(analysis.medicalSections!.Badanie.length).toBeGreaterThan(0);
  });

  // Test case: Ambiguous section classification
  test('should handle text that could belong to multiple sections', async () => {
    const ambiguousText = 'Temperatura 38°C, zalecam leki przeciwgorączkowe.';
    const analysis = await analyzeContent(ambiguousText);
    
    // Check that the text is assigned to at least one section
    const totalLines = Object.values(analysis.medicalSections!).reduce(
      (sum, lines) => sum + lines.length, 0
    );
    expect(totalLines).toBeGreaterThan(0);
  });

  // Test case: Very long notes
  test('should handle very long notes correctly', async () => {
    let longText = '';
    for (let i = 0; i < 20; i++) {
      longText += 'Pacjent zgłasza kaszel od dwóch tygodni. ';
      longText += 'Temperatura 38.5°C. Osłuchowo świsty w oskrzelach. ';
      longText += 'Rozpoznanie: zapalenie oskrzeli. ';
      longText += 'Zalecam antybiotyk. Kontrola za tydzień. ';
      longText += 'Pacjent mieszka z kotem. ';
    }
    
    const analysis = await analyzeContent(longText);
    
    expect(analysis.medicalSections).toBeDefined();
    // All sections should have some content
    expect(analysis.medicalSections!.Wywiad.length).toBeGreaterThan(0);
    expect(analysis.medicalSections!.Badanie.length).toBeGreaterThan(0);
    expect(analysis.medicalSections!.Diagnoza.length).toBeGreaterThan(0);
    expect(analysis.medicalSections!.Zalecenia.length).toBeGreaterThan(0);
  });

  // Test case: Special characters and formatting
  test('should handle text with special characters and formatting', async () => {
    const specialText = 'BADANIE:\n- Temp: 38.5°C\n- Ciśnienie: 120/80 mmHg\nDIAGNOZA: zapalenie oskrzeli!!!';
    const analysis = await analyzeContent(specialText);
    
    expect(analysis.medicalSections).toBeDefined();
    expect(analysis.medicalSections!.Badanie.length).toBeGreaterThan(0);
    expect(analysis.medicalSections!.Diagnoza.length).toBeGreaterThan(0);
  });
  
  // Test case: Non-medical notes
  test('should categorize non-medical content into sections too', async () => {
    const nonMedicalText = 'Spotkanie w czwartek o 15:00. Należy przynieść dokumenty.';
    const analysis = await analyzeContent(nonMedicalText);
    
    // Even non-medical text should be categorized (by default to Wywiad)
    expect(analysis.medicalSections).toBeDefined();
    const totalLines = Object.values(analysis.medicalSections!).reduce(
      (sum, lines) => sum + lines.length, 0
    );
    expect(totalLines).toBeGreaterThan(0);
  });
});
