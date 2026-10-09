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
import { UserRole } from '@gestion-pas/types';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  dniCuil: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  codigoPostal: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  productorId: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

export default function NuevoAseguradoScreen({ navigation }: any) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isProductor = user?.perfil === UserRole.PRODUCTOR;

  // Load productores list for the picker (organizador only)
  const { data: productores, isLoading: loadingProductores } = useQuery({
    queryKey: ['productores'],
    queryFn: () => api.get('/productores').then((r) => r.data),
    enabled: !isProductor,
  });

  // For productor: get own productor record to pre-fill productorId
  const { data: myProductor, isLoading: loadingMyProductor } = useQuery({
    queryKey: ['my-productor'],
    queryFn: () => api.get('/productores').then((r) => r.data[0]), // productor only sees their own
    enabled: isProductor,
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isProductor && myProductor?.id) {
      setValue('productorId', myProductor.id);
    }
  }, [myProductor, isProductor, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/asegurados', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asegurados'] });
      navigation.goBack();
    },
  });

  const [serverError, setServerError] = React.useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await mutation.mutateAsync(data);
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Error al crear el asegurado.');
    }
  };

  if (isProductor && loadingMyProductor) return <LoadingState />;
  if (!isProductor && loadingProductores) return <LoadingState />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Field label="Nombre *" error={errors.nombre?.message}>
            <Controller control={control} name="nombre" render={({ field }) => (
              <TextInput style={[styles.input, errors.nombre && styles.inputError]}
                placeholder="Nombre completo" placeholderTextColor="#4a5568"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </Field>

          <Field label="DNI / CUIL *" error={errors.dniCuil?.message}>
            <Controller control={control} name="dniCuil" render={({ field }) => (
              <TextInput style={[styles.input, errors.dniCuil && styles.inputError]}
                placeholder="20-12345678-3" placeholderTextColor="#4a5568" keyboardType="numeric"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <Controller control={control} name="email" render={({ field }) => (
              <TextInput style={styles.input} placeholder="correo@ejemplo.com"
                placeholderTextColor="#4a5568" keyboardType="email-address" autoCapitalize="none"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </Field>

          <Field label="Teléfono">
            <Controller control={control} name="telefono" render={({ field }) => (
              <TextInput style={styles.input} placeholder="+54 11 1234-5678"
                placeholderTextColor="#4a5568" keyboardType="phone-pad"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </Field>

          <Field label="Dirección">
            <Controller control={control} name="direccion" render={({ field }) => (
              <TextInput style={styles.input} placeholder="Av. Corrientes 1234"
                placeholderTextColor="#4a5568"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </Field>

          <Field label="Código Postal">
            <Controller control={control} name="codigoPostal" render={({ field }) => (
              <TextInput style={styles.input} placeholder="1414"
                placeholderTextColor="#4a5568" keyboardType="numeric"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </Field>

          <Field label="Fecha de Nacimiento (YYYY-MM-DD)">
            <Controller control={control} name="fechaNacimiento" render={({ field }) => (
              <TextInput style={styles.input} placeholder="1990-01-15"
                placeholderTextColor="#4a5568"
                onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />
            )} />
          </Field>

          {/* Productor picker — hidden for productor role (pre-filled) */}
          {!isProductor && (
            <Field label="Productor *" error={errors.productorId?.message}>
              <Controller control={control} name="productorId" render={({ field }) => (
                <View style={styles.pickerContainer}>
                  {(productores ?? []).map((p: any) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.pickerOption, field.value === p.id && styles.pickerSelected]}
                      onPress={() => field.onChange(p.id)}
                    >
                      <Text style={[styles.pickerText, field.value === p.id && styles.pickerTextSelected]}>
                        {p.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} />
            </Field>
          )}

          {serverError && (
            <View style={styles.serverError}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, isSubmitting && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#040a18" /> : <Text style={styles.btnText}>Crear Asegurado</Text>}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { color: '#a0aec0', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  error: { color: '#fc8181', fontSize: 12, marginTop: 4 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040a18' },
  scroll: { padding: 16, paddingBottom: 40 },
  input: {
    backgroundColor: '#0a1628',
    borderWidth: 1,
    borderColor: '#1a2744',
    borderRadius: 8,
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  inputError: { borderColor: '#e53e3e' },
  pickerContainer: { gap: 6 },
  pickerOption: {
    backgroundColor: '#0a1628',
    borderWidth: 1,
    borderColor: '#1a2744',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickerSelected: { borderColor: '#00d4ff', backgroundColor: '#0d1f2b' },
  pickerText: { color: '#a0aec0', fontSize: 14 },
  pickerTextSelected: { color: '#00d4ff', fontWeight: '600' },
  serverError: { backgroundColor: '#2d1515', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e53e3e' },
  serverErrorText: { color: '#fc8181', fontSize: 13 },
  btn: { backgroundColor: '#00d4ff', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#040a18', fontWeight: '700', fontSize: 16 },
});
