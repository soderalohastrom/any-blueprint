/**
 * Blueprint Vision - Main Screen
 * HANDSOME CLAUDE IMPLEMENTATION 🎩
 * 
 * A beautiful chat-like interface for generating stunning blueprints
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Generation states for rich UX
type GenerationState = 
  | 'idle' 
  | 'enriching' 
  | 'generating' 
  | 'complete' 
  | 'error';

interface BlueprintResult {
  imageUrl: string;
  enrichedPrompt?: string;
}

// Status messages for each generation phase
const STATUS_MESSAGES: Record<GenerationState, string> = {
  idle: '',
  enriching: '🧠 Transforming your vision into blueprint specs...',
  generating: '⚙️ Rendering your blueprint...',
  complete: '✨ Blueprint complete!',
  error: '❌ Something went wrong',
};

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;
    
    // Reset state
    setGenerationState('enriching');
    setStatusMessage(STATUS_MESSAGES.enriching);
    setResult(null);
    setError(null);
    setElapsedTime(0);

    // Start elapsed time counter
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      // Step 1: Start the generation job
      const response = await fetch('/api/blueprint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: inputText,
          diagram_type: 'infographic',
          aspect_ratio: '16:9',
          resolution: '2K',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start generation');
      }

      const { jobId } = await response.json();
      setGenerationState('generating');
      setStatusMessage(STATUS_MESSAGES.generating);

      // Step 2: Poll for completion
      let complete = false;
      while (!complete) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusRes = await fetch(`/api/blueprint/status/${jobId}`);
        const status = await statusRes.json();

        if (status.status === 'complete') {
          complete = true;
          
          // Step 3: Get the result
          const downloadRes = await fetch(`/api/blueprint/download/${jobId}`);
          const downloadData = await downloadRes.json();
          
          setResult({
            imageUrl: downloadData.imageUrl,
            enrichedPrompt: downloadData.enrichedPrompt,
          });
          setGenerationState('complete');
          setStatusMessage(STATUS_MESSAGES.complete);
          
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Generation failed');
        }
        // Otherwise keep polling...
      }

    } catch (err) {
      console.error('Generation error:', err);
      setGenerationState('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatusMessage(STATUS_MESSAGES.error);
    } finally {
      clearInterval(timer);
    }
  }, [inputText]);

  const handleReset = () => {
    setGenerationState('idle');
    setResult(null);
    setError(null);
    setInputText('');
    setElapsedTime(0);
  };

  const isProcessing = generationState === 'enriching' || generationState === 'generating';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>🔷 Blueprint Vision</Text>
          <Text style={styles.subtitle}>
            Transform your ideas into stunning technical blueprints
          </Text>
        </View>

        {/* Instruction - only show when idle */}
        {generationState === 'idle' && !result && (
          <>
            <View style={styles.instructionContainer}>
              <Ionicons name="bulb-outline" size={20} color="#4fd1c5" />
              <Text style={styles.instruction}>
                Describe any concept, metaphor, or system — and watch it become a blueprint
              </Text>
            </View>

            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Try something like:</Text>
              <TouchableOpacity onPress={() => setInputText('The complexity of a project, like an iceberg')}>
                <Text style={styles.example}>"The complexity of a project, like an iceberg"</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInputText('How the subconscious processes dreams')}>
                <Text style={styles.example}>"How the subconscious processes dreams"</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInputText('The architecture of a difficult conversation')}>
                <Text style={styles.example}>"The architecture of a difficult conversation"</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Display Area */}
        <View style={styles.displayArea}>
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4fd1c5" />
              <Text style={styles.loadingText}>{statusMessage}</Text>
              <Text style={styles.elapsedText}>{elapsedTime}s elapsed</Text>
              {generationState === 'generating' && (
                <Text style={styles.loadingHint}>
                  Blueprint generation typically takes 15-30 seconds
                </Text>
              )}
            </View>
          ) : result ? (
            <View style={styles.resultContainer}>
              <Image
                source={{ uri: result.imageUrl }}
                style={styles.blueprintImage}
                resizeMode="contain"
              />
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
                  <Ionicons name="refresh" size={20} color="#4fd1c5" />
                  <Text style={styles.actionButtonText}>New Blueprint</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#f56565" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="grid-outline" size={64} color="#2d4a6f" />
              <Text style={styles.placeholderText}>Your blueprint will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input Section */}
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
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isProcessing) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
          >
            <Ionicons
              name={isProcessing ? 'hourglass-outline' : 'send'}
              size={24}
              color={inputText.trim() && !isProcessing ? '#4fd1c5' : '#3a5a7a'}
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
    marginBottom: 8,
    paddingLeft: 12,
  },
  displayArea: {
    flex: 1,
    minHeight: 350,
    backgroundColor: '#0a1628',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a365d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
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
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#4fd1c5',
    textAlign: 'center',
  },
  elapsedText: {
    fontSize: 14,
    color: '#5a7a9a',
  },
  loadingHint: {
    fontSize: 12,
    color: '#3a5a7a',
    fontStyle: 'italic',
    marginTop: 8,
  },
  resultContainer: {
    width: '100%',
    height: '100%',
  },
  blueprintImage: {
    width: '100%',
    height: '85%',
    backgroundColor: '#0a1628',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a365d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
  },
  actionButtonText: {
    color: '#4fd1c5',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#f56565',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1a365d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#4fd1c5',
    fontSize: 14,
    fontWeight: '600',
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
