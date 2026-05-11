// Lista simples dos objetos da página ajuda.html.
// Para editar um presente: troque name, image ou whatsappMessage neste array.
// Para esconder/remover um item já doado: apague ou comente o bloco correspondente.
// Não há Supabase aqui; a remoção é manual depois da confirmação pelo WhatsApp.
const WHATSAPP_PHONE = "5579991439093";

window.pmWhatsappPhone = WHATSAPP_PHONE;
window.pmPresentes = [
  {
    "name": "Armário de cozinha",
    "image": "assets/presentes/armario-de-cozinha.webp",
    "whatsappMessage": "Olá! Quero doar armário de cozinha para Pedro e Maynara."
  },
  {
    "name": "Cooktop",
    "image": "assets/presentes/cooktop.webp",
    "whatsappMessage": "Olá! Quero doar cooktop para Pedro e Maynara."
  },
  {
    "name": "Guarda-roupa",
    "image": "assets/presentes/guarda-roupa.webp",
    "whatsappMessage": "Olá! Quero doar guarda-roupa para Pedro e Maynara."
  },
  {
    "name": "Mesa de jantar",
    "image": "assets/presentes/mesa-de-jantar.webp",
    "whatsappMessage": "Olá! Quero doar mesa de jantar para Pedro e Maynara."
  },
  {
    "name": "Televisão",
    "image": "assets/presentes/televisao.webp",
    "whatsappMessage": "Olá! Quero doar televisão para Pedro e Maynara."
  },
  {
    "name": "Painel de TV",
    "image": "assets/presentes/painel-de-tv.webp",
    "whatsappMessage": "Olá! Quero doar painel de tv para Pedro e Maynara."
  },
  {
    "name": "Sofá",
    "image": "assets/presentes/sofa.webp",
    "whatsappMessage": "Olá! Quero doar sofá para Pedro e Maynara."
  },
  {
    "name": "Aspirador de pó",
    "image": "assets/presentes/aspirador-de-po.webp",
    "whatsappMessage": "Olá! Quero doar aspirador de pó para Pedro e Maynara."
  },
  {
    "name": "Passadeira a vapor",
    "image": "assets/presentes/passadeira-a-vapor.webp",
    "whatsappMessage": "Olá! Quero doar passadeira a vapor para Pedro e Maynara."
  },
  {
    "name": "Cesto de roupas",
    "image": "assets/presentes/cesto-de-roupas.webp",
    "whatsappMessage": "Olá! Quero doar cesto de roupas para Pedro e Maynara."
  },
  {
    "name": "Conjunto lixeira banheiro",
    "image": "assets/presentes/conjunto-lixeira-banheiro.webp",
    "whatsappMessage": "Olá! Quero doar conjunto lixeira banheiro para Pedro e Maynara."
  },
  {
    "name": "Protetor de colchão",
    "image": "assets/presentes/protetor-de-colchao.webp",
    "whatsappMessage": "Olá! Quero doar protetor de colchão para Pedro e Maynara."
  },
  {
    "name": "Cobertor",
    "image": "assets/presentes/cobertor.webp",
    "whatsappMessage": "Olá! Quero doar cobertor para Pedro e Maynara."
  },
  {
    "name": "Jogo de cama",
    "image": "assets/presentes/jogo-de-cama.webp",
    "whatsappMessage": "Olá! Quero doar jogo de cama para Pedro e Maynara."
  },
  {
    "name": "Cama box",
    "image": "assets/presentes/cama-box.webp",
    "whatsappMessage": "Olá! Quero doar cama box para Pedro e Maynara."
  },
  {
    "name": "Lixeira automática",
    "image": "assets/presentes/lixeira-automatica.webp",
    "whatsappMessage": "Olá! Quero doar lixeira automática para Pedro e Maynara."
  },
  {
    "name": "Porta-temperos",
    "image": "assets/presentes/porta-temperos.webp",
    "whatsappMessage": "Olá! Quero doar porta-temperos para Pedro e Maynara."
  },
  {
    "name": "Batedeira",
    "image": "assets/presentes/batedeira.webp",
    "whatsappMessage": "Olá! Quero doar batedeira para Pedro e Maynara."
  },
  {
    "name": "Grill",
    "image": "assets/presentes/grill.webp",
    "whatsappMessage": "Olá! Quero doar grill para Pedro e Maynara."
  },
  {
    "name": "Forno elétrico",
    "image": "assets/presentes/forno-eletrico.webp",
    "whatsappMessage": "Olá! Quero doar forno elétrico para Pedro e Maynara."
  },
  {
    "name": "Micro-ondas",
    "image": "assets/presentes/micro-ondas.webp",
    "whatsappMessage": "Olá! Quero doar micro-ondas para Pedro e Maynara."
  },
  {
    "name": "Air fryer",
    "image": "assets/presentes/air-fryer.webp",
    "whatsappMessage": "Olá! Quero doar air fryer para Pedro e Maynara."
  },
  {
    "name": "Chaleira elétrica",
    "image": "assets/presentes/chaleira-eletrica.webp",
    "whatsappMessage": "Olá! Quero doar chaleira elétrica para Pedro e Maynara."
  },
  {
    "name": "Liquidificador",
    "image": "assets/presentes/liquidificador.webp",
    "whatsappMessage": "Olá! Quero doar liquidificador para Pedro e Maynara."
  },
  {
    "name": "Jogo de copos",
    "image": "assets/presentes/jogo-de-copos.webp",
    "whatsappMessage": "Olá! Quero doar jogo de copos para Pedro e Maynara."
  },
  {
    "name": "Jogo de xícaras",
    "image": "assets/presentes/jogo-de-xicaras.webp",
    "whatsappMessage": "Olá! Quero doar jogo de xícaras para Pedro e Maynara."
  },
  {
    "name": "Taças de sobremesa",
    "image": "assets/presentes/tacas-de-sobremesa.webp",
    "whatsappMessage": "Olá! Quero doar taças de sobremesa para Pedro e Maynara."
  },
  {
    "name": "Jogo de taças",
    "image": "assets/presentes/jogo-de-tacas.webp",
    "whatsappMessage": "Olá! Quero doar jogo de taças para Pedro e Maynara."
  },
  {
    "name": "Jogo de copos 2",
    "image": "assets/presentes/jogo-de-copos-2.webp",
    "whatsappMessage": "Olá! Quero doar jogo de copos 2 para Pedro e Maynara."
  },
  {
    "name": "Aparelho de jantar",
    "image": "assets/presentes/aparelho-de-jantar.webp",
    "whatsappMessage": "Olá! Quero doar aparelho de jantar para Pedro e Maynara."
  },
  {
    "name": "Faqueiro",
    "image": "assets/presentes/faqueiro.webp",
    "whatsappMessage": "Olá! Quero doar faqueiro para Pedro e Maynara."
  },
  {
    "name": "Jogo de facas",
    "image": "assets/presentes/jogo-de-facas.webp",
    "whatsappMessage": "Olá! Quero doar jogo de facas para Pedro e Maynara."
  },
  {
    "name": "Utensílios de silicone",
    "image": "assets/presentes/utensilios-de-silicone.webp",
    "whatsappMessage": "Olá! Quero doar utensílios de silicone para Pedro e Maynara."
  },
  {
    "name": "Utensílios de inox",
    "image": "assets/presentes/utensilios-de-inox.webp",
    "whatsappMessage": "Olá! Quero doar utensílios de inox para Pedro e Maynara."
  },
  {
    "name": "Tábuas de corte",
    "image": "assets/presentes/tabuas-de-corte.webp",
    "whatsappMessage": "Olá! Quero doar tábuas de corte para Pedro e Maynara."
  },
  {
    "name": "Multiprocessador",
    "image": "assets/presentes/multiprocessador.webp",
    "whatsappMessage": "Olá! Quero doar multiprocessador para Pedro e Maynara."
  },
  {
    "name": "Conjunto escorredor inox",
    "image": "assets/presentes/conjunto-escorredor-inox.webp",
    "whatsappMessage": "Olá! Quero doar conjunto escorredor inox para Pedro e Maynara."
  },
  {
    "name": "Potes herméticos",
    "image": "assets/presentes/potes-hermeticos.webp",
    "whatsappMessage": "Olá! Quero doar potes herméticos para Pedro e Maynara."
  },
  {
    "name": "Potes de vidro",
    "image": "assets/presentes/potes-de-vidro.webp",
    "whatsappMessage": "Olá! Quero doar potes de vidro para Pedro e Maynara."
  },
  {
    "name": "Travessas de vidro",
    "image": "assets/presentes/travessas-de-vidro.webp",
    "whatsappMessage": "Olá! Quero doar travessas de vidro para Pedro e Maynara."
  },
  {
    "name": "Travessas de cerâmica",
    "image": "assets/presentes/travessas-de-ceramica.webp",
    "whatsappMessage": "Olá! Quero doar travessas de cerâmica para Pedro e Maynara."
  },
  {
    "name": "Formas de assar",
    "image": "assets/presentes/formas-de-assar.webp",
    "whatsappMessage": "Olá! Quero doar formas de assar para Pedro e Maynara."
  },
  {
    "name": "Panela de pressão",
    "image": "assets/presentes/panela-de-pressao.webp",
    "whatsappMessage": "Olá! Quero doar panela de pressão para Pedro e Maynara."
  },
  {
    "name": "Frigideiras",
    "image": "assets/presentes/frigideiras.webp",
    "whatsappMessage": "Olá! Quero doar frigideiras para Pedro e Maynara."
  },
  {
    "name": "Potes organizadores",
    "image": "assets/presentes/potes-organizadores.webp",
    "whatsappMessage": "Olá! Quero doar potes organizadores para Pedro e Maynara."
  }
];

// Presentes criativos em formato de cotas simbólicas.
// Para trocar uma imagem, coloque o arquivo em assets/images/presentes-divertidos/ e atualize o campo image.
// Para esconder/remover uma cota já escolhida, apague ou comente o bloco correspondente.
window.pmCotasDivertidas = [
  {
    name: "Netflix do casal",
    price: "R$ 120,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_37_46.png",
    buttonText: "Presentear",
    whatsappMessage: "Olá! Quero doar para a Netflix do casal do ano para Pedro e Maynara."
  },
  {
    name: "Ganhar buquê de flores",
    price: "R$ 300,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_36_37.png",
    buttonText: "Presentear",
    whatsappMessage: "Olá! Quero doar para o presente ganhar buquê de flores para Pedro e Maynara."
  },
  {
    name: "Não pegar fila no buffet",
    price: "R$ 400,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_36_43.png",
    buttonText: "Presentear",
    whatsappMessage: "Olá! Quero doar para Pedro e Maynara não pegarem fila no buffet."
  },
  {
    name: "Ter mesa reservada",
    price: "R$ 500,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_36_48.png",
    buttonText: "Presentear",
    whatsappMessage: "Olá! Quero doar para Pedro e Maynara terem mesa reservada."
  },
  {
    name: "Despertador para a noiva",
    price: "R$ 135,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_38_41.png",
    buttonText: "Presentear",
    whatsappMessage: "Olá! Quero doar um despertador para a noiva para Pedro e Maynara."
  },
  {
    name: "Curso de culinária para noiva",
    price: "R$ 110,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_37_35.png",
    buttonText: "Presentear",
    whatsappMessage: "Olá! Quero doar um curso de culinária para a noiva para Pedro e Maynara."
  }
];
