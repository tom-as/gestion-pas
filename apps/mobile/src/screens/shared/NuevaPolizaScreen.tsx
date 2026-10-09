import React, { useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { UserRole, EstadoPoliza, PeriodicidadRefacturacion } from '@gestion-pas/types';
import LoadingState from '../../components/LoadingState';

const schema = z.object({
  numeroPoliza: z.string().min(1, 'Requerido'),
  vigenciaInicio: z.string().min(1, 'Requerido'),
  vigenciaFin: z.string().min(1, 'Requerido'),
  importeCuotaVigente: z.string().min(1, 'Requerido'),
  modalidadPago: z.string().optional(),
  estado: z.nativeEnum(EstadoPoliza),
  periodicidadRefacturacion: z.nativeEnum(PeriodicidadRefacturacion).optional(),
  aseguradoId: z.string().min(1, 'Requerido'),
  bienId: z.string().min(1, 'Requerido'),
  productorId: z.string().min(1, 'Requerido'),
  companiaId: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

function EnumPicker({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.pickerOption, value === opt && styles.pickerSelected]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.pickerText, value === opt && styles.pickerTextSelected]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function NuevaPolizaScreen({ navigation }: any) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isProductor = user?.perfil === UserRole.PRODUCTOR;

  const { data: asegurados, isLoading: loadingA } = useQuery({
    queryKey: ['asegurados'],
    queryFn: () => api.get('/asegurados').then((r) => r.data),
  });
  const { data: productores, isLoading: loadingP } = useQuery({
    queryKey: ['productores'],
    queryFn: () => api.get('/productores').then((r) => r.data),
    enabled: !isProductor,
  });
  const { data: myProductor, isLoading: loadingMP } = useQuery({
    queryKey: ['my-productor'],
    queryFn: () => api.get('/productores').then((r) => r.data[0]),
    enabled: isProductor,
  });
  const { data: companias, isLoading: loadingC } = useQuery({
    queryKey: ['companias'],
    queryFn: () => api.get('/companias').then((r) => r.data),
  });

  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { estado: EstadoPoliza.ACTIVA },
    });

  const selectedAseguradoId = watch('aseguradoId');

  const { data: bienes } = useQuery({
    queryKey: ['bienes', selectedAseguradoId],
    queryFn: () => api.get(`/bienes/asegurado/${selectedAseguradoId}`).then((r) => r.data),
    enabled: !!selectedAseguradoId,
  });

  useEffect(() => {
    if (isProductor && myProductor?.id) setValue('productorId', myProductor.id);
  }, [myProductor, isProductor, setValue]);

  const [serverError, setServerError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/polizas', {
      ...data,
      importeCuotaVigente: parseFloat(data.importeCuotaVigente),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['polizas'] }); navigation.goBack(); },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try { await mutation.mutateAsync(data); }
    catch (err: any) { setServerError(err?.response?.data?.message ?? 'Error al crear la póliza.'); }
  };

  if (loadingA || loadingC || (isProductor && loadingMP) || (!isProductor && loadingP)) return <LoadingState />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <F label="Número de póliza *" error={errors.numeroPoliza?.message}>
            <Controller control={control} name="numeroPoliza" render={({ field }) => (
              <TextInput style={[styles.input, errors.numeroPoliza && styles.inputError]}
                placeholder="POL-00001" placeholderTextColor="#4a5568"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </F>

          <F label="Vigencia inicio * (YYYY-MM-DD)" error={errors.vigenciaInicio?.message}>
            <Controller control={control} name="vigenciaInicio" render={({ field }) => (
              <TextInput style={[styles.input, errors.vigenciaInicio && styles.inputError]}
                placeholder="2024-01-01" placeholderTextColor="#4a5568"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </F>

          <F label="Vigencia fin * (YYYY-MM-DD)" error={errors.vigenciaFin?.message}>
            <Controller control={control} name="vigenciaFin" render={({ field }) => (
              <TextInput style={[styles.input, errors.vigenciaFin && styles.inputError]}
                placeholder="2025-01-01" placeholderTextColor="#4a5568"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </F>

          <F label="Importe cuota *" error={errors.importeCuotaVigente?.message}>
            <Controller control={control} name="importeCuotaVigente" render={({ field }) => (
              <TextInput style={[styles.input, errors.importeCuotaVigente && styles.inputError]}
                placeholder="15000.00" placeholderTextColor="#4a5568" keyboardType="decimal-pad"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </F>

          <F label="Modalidad de pago">
            <Controller control={control} name="modalidadPago" render={({ field }) => (
              <TextInput style={styles.input} placeholder="Débito automático"
                placeholderTextColor="#4a5568"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </F>

          <F label="Estado *" error={errors.estado?.message}>
            <Controller control={control} name="estado" render={({ field }) => (
              <EnumPicker options={Object.values(EstadoPoliza)} value={field.value} onChange={field.onChange} />
            )} />
          </F>

          <F label="Periodicidad">
            <Controller control={control} name="periodicidadRefacturacion" render={({ field }) => (
              <EnumPicker options={Object.values(PeriodicidadRefacturacion)} value={field.value ?? ''} onChange={field.onChange} />
            )} />
          </F>

          <F label="Asegurado *" error={errors.aseguradoId?.message}>
            <Controller control={control} name="aseguradoId" render={({ field }) => (
              <View style={{ gap: 6 }}>
                {(asegurados ?? []).map((a: any) => (
                  <TouchableOpacity key={a.id}
                    style={[styles.pickerOption, field.value === a.id && styles.pickerSelected]}
                    onPress={() => { field.onChange(a.id); setValue('bienId', ''); }}
                  >
                    <Text style={[styles.pickerText, field.value === a.id && styles.pickerTextSelected]}>{a.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )} />
          </F>

          {selectedAseguradoId && (
            <F label="Bien asegurado *" error={errors.bienId?.message}>
              <Controller control={control} name="bienId" render={({ field }) => (
                <View style={{ gap: 6 }}>
                  {(bienes ?? []).map((b: any) => (
                    <TouchableOpacity key={b.id}
                      style={[styles.pickerOption, field.value === b.id && styles.pickerSelected]}
                      onPress={() => field.onChange(b.id)}
                    >
                      <Text style={[styles.pickerText, field.value === b.id && styles.pickerTextSelected]}>
                        {b.descripcion ?? b.marca ?? b.tipo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {(bienes ?? []).length === 0 && <Text style={styles.emptyPicker}>Sin bienes para este asegurado.</Text>}
                </View>
              )} />
            </F>
          )}

          {!isProductor && (
            <F label="Productor *" error={errors.productorId?.message}>
              <Controller control={control} name="productorId" render={({ field }) => (
                <View style={{ gap: 6 }}>
                  {(productores ?? []).map((p: any) => (
                    <TouchableOpacity key={p.id}
                      style={[styles.pickerOption, field.value === p.id && styles.pickerSelected]}
                      onPress={() => field.onChange(p.id)}
                    >
                      <Text style={[styles.pickerText, field.value === p.id && styles.pickerTextSelected]}>{p.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} />
            </F>
          )}

          <F label="Compañía *" error={errors.companiaId?.message}>
            <Controller control={control} name="companiaId" render={({ field }) => (
              <View style={{ gap: 6 }}>
                {(companias ?? []).map((c: any) => (
                  <TouchableOpacity key={c.id}
                    style={[styles.pickerOption, field.value === c.id && styles.pickerSelected]}
                    onPress={() => field.onChange(c.id)}
                  >
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
            {isSubmitting ? <ActivityIndicator color="#040a18" /> : <Text style={styles.btnText}>Crear Póliza</Text>}
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
  pickerOption: { backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#1a2744', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  pickerSelected: { borderColor: '#00d4ff', backgroundColor: '#0d1f2b' },
  pickerText: { color: '#a0aec0', fontSize: 14 },
  pickerTextSelected: { color: '#00d4ff', fontWeight: '600' },
  emptyPicker: { color: '#4a5568', fontSize: 13, paddingVertical: 8 },
  serverError: { backgroundColor: '#2d1515', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e53e3e' },
  serverErrorText: { color: '#fc8181', fontSize: 13 },
  btn: { backgroundColor: '#00d4ff', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#040a18', fontWeight: '700', fontSize: 16 },
});
