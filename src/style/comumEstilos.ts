// Arquivo: src/style/comumEstilos.ts
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { cores } from '../constantes/cores';

export const comumEstilosObjeto = {

  screenContainer: {
    flex: 1,
    backgroundColor: cores.branco,
  } as ViewStyle,
  
  flexSpacer: {
    flex: 1, 
  } as ViewStyle,

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: cores.branco,
  } as ViewStyle,
  
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.primaria,
  } as TextStyle,

  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  } as ViewStyle,
  
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: cores.preto,
  } as TextStyle,

  input: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: cores.preto,
  } as TextStyle,

  formTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: cores.preto,
    marginTop: 20,
    marginBottom: 8,
  } as TextStyle,
  
  formSubtitle: {
    fontSize: 18,
    color: cores.preto,
    marginBottom: 24,
  } as TextStyle,

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
  } as ViewStyle,
  
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: cores.preto,
  } as TextStyle,

  passwordEyeIcon: {
    padding: 16,
  } as ViewStyle,

  primaryButton: {
    backgroundColor: cores.primaria,
    padding: 18,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  
  buttonText: {
    color: cores.preto,
    fontSize: 16,
    fontWeight: 'bold',
  } as TextStyle,
  
  secondaryButton: {
    padding: 18,
    borderRadius: 50,
    alignItems: 'center',
  } as ViewStyle,
  
  secondaryButtonText: {
    color: cores.secundaria,
    fontSize: 16,
    fontWeight: 'bold',
  } as TextStyle,

  emptyCard: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  } as ViewStyle,
  
  emptyCardText: {
    fontSize: 16,
    color: cores.secundaria,
    textAlign: 'center',
    marginBottom: 16,
  } as TextStyle,
  
  emptyCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.primaria + '20',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  } as ViewStyle,
  
  emptyCardButtonText: {
    color: cores.primaria,
    fontWeight: 'bold',
    fontSize: 14,
  } as TextStyle,

  textoNormal:{
    color: cores.preto,
    fontWeight: 'bold',
    fontSize: 18,
  } as TextStyle,

  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.preto,
    marginBottom: 8,
    marginLeft: 4,
  } as TextStyle,

};