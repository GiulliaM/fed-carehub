//aqui vamos definir as cores do nosso aplicativo

interface PaletaCores{
    primaria: string;
    secundaria: string;
    destaque: string;
    fundo: string;
    preto: string;
    branco: string;
    azulClaro: string;
    cinzaClaro: string;
    alerta: string;

}

//agora vamos exportar o obejto pra os outros arquivopds poderem acessar ele, bem mais fácil assim, né?
//funcao construtora
export const cores: PaletaCores = {
    primaria: '#57CC99',
    secundaria: '#38a2a3',
    destaque: '#5838a3',
    fundo: '#c7f9cc',
    preto: '#000000',
    branco: '#ffffff',
    azulClaro: '#0097A7',
    cinzaClaro: '#f3f3f3',
    alerta: '#FF6B6B',
};