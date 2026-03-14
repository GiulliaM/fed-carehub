
import { Platform, StyleSheet } from 'react-native';
const cores = {
    branco: '#ffffff',
    preto: '#1c1c1c',
    cinzaClaro: '#a0a0a0',
    primaria: '#007bff', 
    secundaria: '#28a745', 
    alerta: '#dc3545', 
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: cores.branco,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: cores.branco,
  },
  headerImage: {
    width: 140,
    height: 44,
    resizeMode: 'contain',
  },

  viewData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f8f8f8', // Fundo mais leve
    borderRadius: 12,
    ...Platform.select({
      android: { elevation: 2 },
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  textoNormal: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.preto,
  },
  dateText: {
    fontSize: 15,
    color: cores.cinzaClaro,
  },

  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: cores.preto,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: cores.cinzaClaro,
  },

  plusButton: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 6 },
      ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    }),
  },

  emptyCard: {
    marginTop: 28,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 1 },
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  emptyCardText: {
    color: cores.cinzaClaro,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 20,
  },
  emptyCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  emptyCardButtonText: {
    color: cores.primaria,
    fontWeight: '600',
  },

  formSubtitle: {
    fontSize: 14,
    color: cores.cinzaClaro,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  flexSpacer: {
    flex: 1,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: cores.primaria,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: cores.branco,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
  },
  secondaryButtonText: {
    color: cores.preto,
    fontWeight: '600',
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 5, 
    ...Platform.select({
      android: { elevation: 1 },
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.preto,
  },
  taskSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: cores.cinzaClaro,
  },

  completeButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.secundaria,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  loadingCenter: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
  position: "absolute",
  right: 22,
  bottom: 22,
  width: 58,
  height: 58,
  borderRadius: 29,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 6,
},
fabIcon: {
  color: "#fff",
  fontSize: 32,
  fontWeight: "700",
  lineHeight: 34,
},

});

export default styles;