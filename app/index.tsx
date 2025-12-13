import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Blueprint Vision - Main Screen
 * 
 * TODO for competing LLMs:
 * 1. Implement LLM prompt enrichment (transform user input → detailed blueprint prompt)
 * 2. Connect to Blueprint MCP via API (StartDiagramJob, CheckJobStatus, DownloadDiagram)
 * 3. Add loading states and progress indication
 * 4. Display generated blueprint image
 * 5. Add error handling and retry logic
 * 
 * The Blueprint MCP expects:
 * - description: string (the enriched prompt)
 * - diagram_type: 'architecture' | 'flowchart' | 'data_flow' | 'sequence' | 'infographic' | 'generic'
 * - aspect_ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9'
 * - resolution: '1K' | '2K'
 * 
 * See PRD for full architecture details.
 */

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    
    // TODO: Implement the magic here!
    // 1. Send inputText to LLM for prompt enrichment
    // 2. Call Blueprint MCP with enriched prompt
    // 3. Poll for completion
    // 4. Display result
    
    console.log('User vision:', inputText);
    
    // Placeholder - remove when implementing
    setTimeout(() => {
      setIsGenerating(false);
      alert('Blueprint generation not yet implemented!\n\nYour vision: ' + inputText);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>🔷 Blueprint Vision</Text>
          <Text style={styles.subtitle}>
            Transform your ideas into stunning technical blueprints
          </Text>
        </View>

        {/* Instruction */}
        <View style={styles.instructionContainer}>
          <Ionicons name="bulb-outline" size={20} color="#4fd1c5" />
          <Text style={styles.instruction}>
            Describe any concept, metaphor, or system — and watch it become a blueprint
          </Text>
        </View>

        {/* Examples */}
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>Try something like:</Text>
          <Text style={styles.example}>"The complexity of a project, like an iceberg"</Text>
          <Text style={styles.example}>"How the subconscious processes dreams"</Text>
          <Text style={styles.example}>"The architecture of a difficult conversation"</Text>
        </View>

        {/* Generated Blueprint Display Area */}
        <View style={styles.displayArea}>
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>⚙️ Rendering your vision...</Text>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="grid-outline" size={64} color="#2d4a6f" />
              <Text style={styles.placeholderText}>Your blueprint will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input Section - Chat-like UI */}
      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="What blueprint can you envision?"
            placeholderTextColor="#5a7a9a"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isGenerating}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isGenerating) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!inputText.trim() || isGenerating}
          >
            <Ionicons
              name={isGenerating ? 'hourglass-outline' : 'send'}
              size={24}
              color={inputText.trim() && !isGenerating ? '#4fd1c5' : '#3a5a7a'}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.charCount}>{inputText.length}/500</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8ba3be',
    textAlign: 'center',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a365d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  instruction: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e0',
    lineHeight: 20,
  },
  examplesContainer: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 12,
    color: '#5a7a9a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  example: {
    fontSize: 13,
    color: '#4fd1c5',
    fontStyle: 'italic',
    marginBottom: 6,
    paddingLeft: 12,
  },
  displayArea: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#0a1628',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a365d',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderContainer: {
    alignItems: 'center',
    gap: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#3a5a7a',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4fd1c5',
  },
  inputSection: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#0d1b2a',
    borderTopWidth: 1,
    borderTopColor: '#1a365d',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a365d',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#e2e8f0',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0d1b2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  charCount: {
    fontSize: 11,
    color: '#3a5a7a',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 8,
  },
});
