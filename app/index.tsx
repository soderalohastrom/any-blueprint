/**
 * Blueprint Vision - Main Screen
 * HANDSOME CLAUDE IMPLEMENTATION 🎩
 */

import { useState, useCallback, useEffect } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:3001';

type GenerationState = 'idle' | 'enriching' | 'generating' | 'complete' | 'error';

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
}

interface BlueprintResult {
  imageUrl: string;
  enrichedPrompt?: string;
}

const STATUS_MESSAGES: Record<GenerationState, string> = {
  idle: '',
  enriching: '🧠 Transforming your vision...',
  generating: '⚙️ Rendering blueprint...',
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
  
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [showModelPicker, setShowModelPicker] = useState(false);

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch(`${API_URL}/api/models`);
        const data = await res.json();
        setModels(data.models || []);
        if (data.default) setSelectedModel(data.default);
      } catch (err) {
        console.log('Using default models');
        setModels([
          { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Fast & capable' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Quick & affordable' },
        ]);
      }
    }
    loadModels();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;
    
    setGenerationState('enriching');
    setStatusMessage(STATUS_MESSAGES.enriching);
    setResult(null);
    setError(null);
    setElapsedTime(0);

    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: inputText, model: selectedModel }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start');
      }

      const { jobId } = await response.json();

      let complete = false;
      while (!complete) {
        await new Promise(r => setTimeout(r, 1500));
        
        const statusRes = await fetch(`${API_URL}/api/status/${jobId}`);
        const status = await statusRes.json();

        if (status.status === 'generating') {
          setGenerationState('generating');
          setStatusMessage(STATUS_MESSAGES.generating);
        } else if (status.status === 'complete') {
          complete = true;
          const resultRes = await fetch(`${API_URL}/api/result/${jobId}`);
          const data = await resultRes.json();
          
          setResult({ imageUrl: data.imageUrl, enrichedPrompt: data.enrichedPrompt });
          setGenerationState('complete');
          setStatusMessage(STATUS_MESSAGES.complete);
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Generation failed');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setGenerationState('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatusMessage(STATUS_MESSAGES.error);
    } finally {
      clearInterval(timer);
    }
  }, [inputText, selectedModel]);

  const handleReset = () => {
    setGenerationState('idle');
    setResult(null);
    setError(null);
    setInputText('');
    setElapsedTime(0);
  };

  const currentModel = models.find(m => m.id === selectedModel);
  const isProcessing = generationState === 'enriching' || generationState === 'generating';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <Text style={styles.title}>🔷 Blueprint Vision</Text>
          <Text style={styles.subtitle}>Transform ideas into stunning technical blueprints</Text>
        </View>

        <TouchableOpacity 
          style={styles.modelSelector}
          onPress={() => setShowModelPicker(true)}
          disabled={isProcessing}
        >
          <View style={styles.modelInfo}>
            <Ionicons name="hardware-chip-outline" size={18} color="#4fd1c5" />
            <Text style={styles.modelName}>{currentModel?.name || 'Select Model'}</Text>
            <Text style={styles.modelDescription}>{currentModel?.description}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#5a7a9a" />
        </TouchableOpacity>

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
              {[
                'The complexity of a project, like an iceberg',
                'How the subconscious processes dreams',
                'The architecture of a difficult conversation',
              ].map((ex, i) => (
                <TouchableOpacity key={i} onPress={() => setInputText(ex)}>
                  <Text style={styles.example}>"{ex}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.displayArea}>
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4fd1c5" />
              <Text style={styles.loadingText}>{statusMessage}</Text>
              <Text style={styles.modelUsed}>Using {currentModel?.name}</Text>
              <Text style={styles.elapsedText}>{elapsedTime}s elapsed</Text>
            </View>
          ) : result ? (
            <View style={styles.resultContainer}>
              <Image source={{ uri: result.imageUrl }} style={styles.blueprintImage} resizeMode="contain" />
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
            style={[styles.sendButton, (!inputText.trim() || isProcessing) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
          >
            <Ionicons name={isProcessing ? 'hourglass-outline' : 'send'} size={24} color={inputText.trim() && !isProcessing ? '#4fd1c5' : '#3a5a7a'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.charCount}>{inputText.length}/500</Text>
      </View>

      <Modal visible={showModelPicker} transparent animationType="slide" onRequestClose={() => setShowModelPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModelPicker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select AI Model</Text>
              <TouchableOpacity onPress={() => setShowModelPicker(false)}>
                <Ionicons name="close" size={24} color="#8ba3be" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={models}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modelOption, item.id === selectedModel && styles.modelOptionSelected]}
                  onPress={() => { setSelectedModel(item.id); setShowModelPicker(false); }}
                >
                  <View style={styles.modelOptionContent}>
                    <Text style={styles.modelOptionName}>{item.name}</Text>
                    <Text style={styles.modelOptionDesc}>{item.description}</Text>
                    <Text style={styles.modelOptionProvider}>{item.provider}</Text>
                  </View>
                  {item.id === selectedModel && <Ionicons name="checkmark-circle" size={24} color="#4fd1c5" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  scrollContent: { flexGrow: 1, padding: 20 },
  headerSection: { alignItems: 'center', marginBottom: 16, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8ba3be', textAlign: 'center' },
  modelSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a365d', padding: 12, borderRadius: 12, marginBottom: 16 },
  modelInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modelName: { fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
  modelDescription: { fontSize: 12, color: '#5a7a9a' },
  instructionContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a365d', padding: 16, borderRadius: 12, marginBottom: 20, gap: 12 },
  instruction: { flex: 1, fontSize: 14, color: '#cbd5e0', lineHeight: 20 },
  examplesContainer: { marginBottom: 24 },
  examplesTitle: { fontSize: 12, color: '#5a7a9a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  example: { fontSize: 13, color: '#4fd1c5', fontStyle: 'italic', marginBottom: 8, paddingLeft: 12 },
  displayArea: { flex: 1, minHeight: 300, backgroundColor: '#0a1628', borderRadius: 16, borderWidth: 1, borderColor: '#1a365d', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  placeholderContainer: { alignItems: 'center', gap: 16 },
  placeholderText: { fontSize: 14, color: '#3a5a7a' },
  loadingContainer: { alignItems: 'center', padding: 20, gap: 12 },
  loadingText: { fontSize: 16, color: '#4fd1c5', textAlign: 'center' },
  modelUsed: { fontSize: 12, color: '#5a7a9a' },
  elapsedText: { fontSize: 14, color: '#5a7a9a' },
  resultContainer: { width: '100%', height: '100%' },
  blueprintImage: { width: '100%', height: '85%', backgroundColor: '#0a1628' },
  resultActions: { flexDirection: 'row', justifyContent: 'center', padding: 12, gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a365d', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, gap: 8 },
  actionButtonText: { color: '#4fd1c5', fontSize: 14, fontWeight: '600' },
  errorContainer: { alignItems: 'center', padding: 20, gap: 16 },
  errorText: { fontSize: 14, color: '#f56565', textAlign: 'center' },
  retryButton: { backgroundColor: '#1a365d', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 },
  retryButtonText: { color: '#4fd1c5', fontSize: 14, fontWeight: '600' },
  inputSection: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, backgroundColor: '#0d1b2a', borderTopWidth: 1, borderTopColor: '#1a365d' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#1a365d', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  textInput: { flex: 1, fontSize: 16, color: '#e2e8f0', maxHeight: 100, paddingVertical: 8 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0d1b2a', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  charCount: { fontSize: 11, color: '#3a5a7a', textAlign: 'right', marginTop: 4, marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0d1b2a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%', paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a365d' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#e2e8f0' },
  modelOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginHorizontal: 16, marginVertical: 4, borderRadius: 12, backgroundColor: '#1a365d' },
  modelOptionSelected: { backgroundColor: '#234a73', borderWidth: 1, borderColor: '#4fd1c5' },
  modelOptionContent: { flex: 1 },
  modelOptionName: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 2 },
  modelOptionDesc: { fontSize: 13, color: '#8ba3be', marginBottom: 2 },
  modelOptionProvider: { fontSize: 11, color: '#5a7a9a', textTransform: 'uppercase' },
});
