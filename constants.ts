import { Product } from './types';

export const COLORS = {
  red: '#C62828',
  green: '#2E7D32',
  gold: '#D4AF37',
  white: '#FFFFFF',
  beige: '#FFF8E1',
  bg: '#F5F5F5',
};

export const MACRO_YETU = {
  name: 'Macro Yetu',
  address: 'Kifica, Rua 22, Estrada Direita do BFA, Benfica',
  phones: ['943831033', '943837995'],
};

export const ANGOLAN_GROUP_NAMES = [
  'Rainha Ginga',
  'Imbondeira',
  'Kundi Paihama',
  'Palanca Negra',
  'Pensador',
  'Mussulo Vibes',
  'Welwitschia',
  'Quedas de Kalandula',
  'Serra da Leba',
  'Semba no Pé'
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Grãos de Café de Angola',
    price: 5000,
    currency: 'Kz',
    category: 'Alimentação',
    image: 'https://picsum.photos/300/300?random=1'
  },
  {
    id: '2',
    name: 'Vinho Tinto Cartuxa',
    price: 18000,
    currency: 'Kz',
    category: 'Bebidas',
    image: 'https://picsum.photos/300/300?random=2'
  },
  {
    id: '3',
    name: 'Chocolate Ferrero Rocher 24un',
    price: 8500,
    currency: 'Kz',
    category: 'Doces',
    image: 'https://picsum.photos/300/300?random=3'
  },
  {
    id: '4',
    name: 'Kit Churrasco Premium',
    price: 45000,
    currency: 'Kz',
    category: 'Alimentação',
    image: 'https://picsum.photos/300/300?random=4'
  },
  {
    id: '5',
    name: 'Cartão Presente Macro Yetu',
    price: 10000,
    currency: 'Kz',
    category: 'Vouchers',
    image: 'https://picsum.photos/300/300?random=5'
  }
];

export const GAME_DATA = {
  icebreaker: [
    "Qual foi o pior presente que já recebeste?",
    "Qual é a tua comida de Natal favorita em Angola?",
    "Se fosses uma rena, qual seria o teu nome?",
    "Qual a música que não pode faltar no Natal?",
    "Arroz de Pato ou Funge no Natal?"
  ],
  truth: [
    "Já devolveste um presente que te deram?",
    "Qual é a tradição de Natal da tua família que achas estranha?",
    "Já fingiste gostar de um presente? Imita a cara que fizeste.",
    "Mostra a última foto da tua galeria."
  ],
  quiz: [
    { q: "Qual é a capital da província do Huambo?", a: "Huambo" },
    { q: "Quem foi a Rainha Ginga?", a: "Rainha do Ndongo e Matamba" },
    { q: "Onde ficam as Quedas de Kalandula?", a: "Malanje" }
  ]
};
