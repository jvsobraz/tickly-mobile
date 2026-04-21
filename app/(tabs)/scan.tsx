import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMutation } from '@tanstack/react-query';
import { ticketsApi, ValidateResult } from '../../src/api/tickets';
import { useAuthStore } from '../../src/store/auth';

type ScanState = 'idle' | 'scanning' | 'result';

export default function ScanScreen() {
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const validateMutation = useMutation({
    mutationFn: (hash: string) => ticketsApi.validate(hash),
    onSuccess: (data) => {
      setResult(data);
      setState('result');
    },
    onError: (err: any) => {
      setResult({ isValid: false, message: err.response?.data?.error || 'Erro ao validar ingresso.' });
      setState('result');
    },
  });

  const handleBarCode = ({ data }: { data: string }) => {
    if (cooldown || state !== 'scanning') return;
    setCooldown(true);
    setState('idle');
    validateMutation.mutate(data);
    setTimeout(() => setCooldown(false), 3000);
  };

  const reset = () => {
    setResult(null);
    setState('idle');
    validateMutation.reset();
  };

  if (!permission) return <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 80 }} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Permissão de Câmera</Text>
        <Text style={styles.permText}>Precisamos da câmera para escanear QR codes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {state === 'scanning' ? (
        <View style={{ flex: 1 }}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCode}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Aponte para o QR Code do ingresso</Text>
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setState('idle')}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : state === 'result' && result ? (
        <View style={styles.center}>
          <View style={[styles.resultCard, result.isValid ? styles.resultValid : styles.resultInvalid]}>
            <Text style={styles.resultIcon}>{result.isValid ? '✅' : '❌'}</Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.isValid && result.ticket && (
              <View style={styles.resultDetails}>
                <Text style={styles.resultDetail}>👤 {result.ticket.holderName}</Text>
                <Text style={styles.resultDetail}>🎟 {result.ticket.ticketTypeName}</Text>
                <Text style={styles.resultDetail}>🎪 {result.ticket.eventTitle}</Text>
                {result.ticket.wasAlreadyUsed && <Text style={[styles.resultDetail, { color: '#e53935' }]}>⚠️ Já foi utilizado</Text>}
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { reset(); setState('scanning'); }}>
            <Text style={styles.scanAgainText}>Escanear Próximo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn2} onPress={reset}>
            <Text style={styles.cancelBtn2Text}>Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.scanIcon}>📱</Text>
          <Text style={styles.scanTitle}>Check-in Scanner</Text>
          <Text style={styles.scanText}>Escaneie o QR code do ingresso para fazer o check-in.</Text>
          {validateMutation.isPending && <ActivityIndicator size="large" color="#6200ea" style={{ marginBottom: 20 }} />}
          <TouchableOpacity
            style={[styles.startBtn, validateMutation.isPending && styles.startBtnDisabled]}
            onPress={() => setState('scanning')}
            disabled={validateMutation.isPending}>
            <Text style={styles.startBtnText}>📷 Iniciar Scanner</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240, borderWidth: 3, borderColor: '#6200ea', borderRadius: 12, backgroundColor: 'transparent' },
  scanHint: { color: '#fff', marginTop: 20, fontSize: 15, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  cancelBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  permIcon: { fontSize: 56, marginBottom: 12 },
  permTitle: { fontSize: 20, fontWeight: '800', color: '#212121', marginBottom: 8 },
  permText: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 24 },
  permBtn: { backgroundColor: '#6200ea', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 14 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  scanIcon: { fontSize: 64, marginBottom: 16 },
  scanTitle: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 8 },
  scanText: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 32 },
  startBtn: { backgroundColor: '#6200ea', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16 },
  startBtnDisabled: { backgroundColor: '#9e9e9e' },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultCard: { width: '100%', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 3 },
  resultValid: { backgroundColor: '#e8f5e9', borderWidth: 2, borderColor: '#4caf50' },
  resultInvalid: { backgroundColor: '#ffebee', borderWidth: 2, borderColor: '#e53935' },
  resultIcon: { fontSize: 56, marginBottom: 12 },
  resultMessage: { fontSize: 18, fontWeight: '700', color: '#212121', textAlign: 'center', marginBottom: 16 },
  resultDetails: { width: '100%', gap: 6 },
  resultDetail: { fontSize: 14, color: '#424242' },
  scanAgainBtn: { backgroundColor: '#6200ea', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  scanAgainText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn2: { paddingVertical: 12 },
  cancelBtn2Text: { color: '#6200ea', fontWeight: '600', fontSize: 15 },
});
