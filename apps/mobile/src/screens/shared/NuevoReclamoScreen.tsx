import React, { useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { UserRole, TipoReclamo } from '@gestion-pas/types';
import LoadingState from '../../components/LoadingState';

const schema = z.object({
  tipo: z.nativeEnum(TipoReclamo),
  descripcion: z.string().optional(),
  fechaApertura: z.string().min(1, 'Requerido'),
  aseguradoId: z.string().min(1, 'Requerido'),
  productorId: z.string().min(1, 'Requerido'),
  companiaId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function ChipPicker({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => (
        <TouchableOpacity key={opt}
          style={[styles.chip, value === opt && styles.chipActive]}
          onPress={() => onChange(opt)}>
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function NuevoReclamoScreen({ navigation }: any) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAsegurado = user?.perfil === UserRole.ASEGURADO;
  const isProductor = user?.perfil === UserRole.PRODUCTOR;
  const isOrganizador = user?.perfil === UserRole.ORGANIZADOR;

  const today = new Date().toISOString().split('T')[0];

  const { data: asegurados, isLoading: loadingA } = useQuery({
    queryKey: ['asegurados'],
    queryFn: () => api.get('/asegurados').then((r) => r.data),
    enabled: !isAsegurado,
  });
  const { data: myProductor, isLoading: loadingMP } = useQuery({
    queryKey: ['my-productor'],
    queryFn: () => api.get('/productores').then((r) => r.data[0]),
    enabled: isProductor,
  });
  const { data: productores, isLoading: loadingP } = useQuery({
    queryKey: ['productores'],
    queryFn: () => api.get('/productores').then((r) => r.data),
    enabled: isOrganizador,
  });
  const { data: companias, isLoading: loadingC } = useQuery({
    queryKey: ['companias'],
    queryFn: () => api.get('/companias').then((r) => r.data),
  });

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { tipo: TipoReclamo.ADMINISTRATIVO, fechaApertura: today },
    });

  useEffect(() => {
    if (isAsegurado && user.aseguradoId) setValue('aseguradoId', user.aseguradoId);
    if (isProductor && myProductor?.id) setValue('productorId', myProductor.id);
  }, [isAsegurado, isProductor, user, myProductor, setValue]);

  const [serverError, setServerError] = React.useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/reclamos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reclamos'] }); navigation.goBack(); },
  });
  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try { await mutation.mutateAsync(data); }
    catch (err: any) { setServerError(err?.response?.data?.message ?? 'Error al crear el reclamo.'); }
  };

  if (loadingC || (isProductor && loadingMP) || (!isAsegurado && loadingA) || (isOrganizador && loadingP)) return <LoadingState />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <F label="Tipo *" error={errors.tipo?.message}>
            <Controller control={control} name="tipo" render={({ field }) => (
              <ChipPicker options={Object.values(TipoReclamo)} value={field.value} onChange={field.onChange} />
            )} />
          </F>

          <F label="Descripción">
            <Controller control={control} name="descripcion" render={({ field }) => (
              <TextInput style={[styles.input, styles.multiline]} placeholder="Describa el reclamo…"
                placeholderTextColor="#4a5568" multiline numberOfLines={4}
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </F>

          <F label="Fecha de apertura * (YYYY-MM-DD)" error={errors.fechaApertura?.message}>
            <Controller control={control} name="fechaApertura" render={({ field }) => (
              <TextInput style={[styles.input, errors.fechaApertura && styles.inputError]}
                placeholder={today} placeholderTextColor="#4a5568"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </F>

          {!isAsegurado && (
            <F label="Asegurado *" error={errors.aseguradoId?.message}>
              <Controller control={control} name="aseguradoId" render={({ field }) => (
                <View style={{ gap: 6 }}>
                  {(asegurados ?? []).map((a: any) => (
                    <TouchableOpacity key={a.id}
                      style={[styles.pickerOption, field.value === a.id && styles.pickerSelected]}
                      onPress={() => field.onChange(a.id)}>
                      <Text style={[styles.pickerText, field.value === a.id && styles.pickerTextSelected]}>{a.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} />
            </F>
          )}

          {isOrganizador && (
            <F label="Productor *" error={errors.productorId?.message}>
              <Controller control={control} name="productorId" render={({ field }) => (
                <View style={{ gap: 6 }}>
                  {(productores ?? []).map((p: any) => (
                    <TouchableOpacity key={p.id}
                      style={[styles.pickerOption, field.value === p.id && styles.pickerSelected]}
                      onPress={() => field.onChange(p.id)}>
                      <Text style={[styles.pickerText, field.value === p.id && styles.pickerTextSelected]}>{p.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} />
            </F>
          )}

          <F label="Compañía (opcional)">
            <Controller control={control} name="companiaId" render={({ field }) => (
              <View style={{ gap: 6 }}>
                {(companias ?? []).map((c: any) => (
                  <TouchableOpacity key={c.id}
                    style={[styles.pickerOption, field.value === c.id && styles.pickerSelected]}
                    onPress={() => field.onChange(field.value === c.id ? '' : c.id)}>
                    <Text style={[styles.pickerText, field.value === c.id && styles.pickerTextSelected]}>{c.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )} />
          </F>

          {serverError && (
            <View style={styles.serverError}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.btn, isSubmitting && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#040a18" /> : <Text style={styles.btnText}>Registrar Reclamo</Text>}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: '#a0aec0', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      {children}
      {error ? <Text style={{ color: '#fc8181', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040a18' },
  scroll: { padding: 16, paddingBottom: 40 },
  input: { backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#1a2744', borderRadius: 8, color: '#fff', fontSize: 15, paddingHorizontal: 14, paddingVertical: 11 },
  inputError: { borderColor: '#e53e3e' },
  multiline: { height: 90, textAlignVertical: 'top' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#1a2744' },
  chipActive: { backgroundColor: '#0d1f2b', borderColor: '#00d4ff' },
  chipText: { color: '#718096', fontSize: 13 },
  chipTextActive: { color: '#00d4ff', fontWeight: '600' },
  pickerOption: { backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#1a2744', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  pickerSelected: { borderColor: '#00d4ff', backgroundColor: '#0d1f2b' },
  pickerText: { color: '#a0aec0', fontSize: 14 },
  pickerTextSelected: { color: '#00d4ff', fontWeight: '600' },
  serverError: { backgroundColor: '#2d1515', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e53e3e' },
  serverErrorText: { color: '#fc8181', fontSize: 13 },
  btn: { backgroundColor: '#00d4ff', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#040a18', fontWeight: '700', fontSize: 16 },
});
