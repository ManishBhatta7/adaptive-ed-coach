
export const generateReadingFeedback = (wordCount: number, sentenceCount: number): string => {
  const templates = [
    `Your reading included approximately ${wordCount} words across ${sentenceCount} sentences. Your pace was good, with clear articulation of most words. You demonstrated confidence in your reading, though there were a few hesitations. Continue practicing to improve fluency on longer passages.`,
    `I noticed good expression in your reading, particularly with dialogue sections. Your pronunciation was generally accurate with only a few challenging words. For improvement, try varying your tone more to match the emotional content of the text.`,
    `You read with good attention to punctuation, pausing appropriately at periods and commas. Your reading speed was appropriate for comprehension. To enhance your reading skills further, practice emphasizing key words in sentences to convey meaning more effectively.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
};
