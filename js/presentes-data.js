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
    "whatsappMessage": "Oi Pedro quero doar \"Armário de cozinha\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Cooktop",
    "image": "assets/presentes/cooktop.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Cooktop\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Guarda-roupa",
    "image": "assets/presentes/guarda-roupa.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Guarda-roupa\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Mesa de jantar",
    "image": "assets/presentes/mesa-de-jantar.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Mesa de jantar\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Televisão",
    "image": "assets/presentes/televisao.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Televisão\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Painel de TV",
    "image": "assets/presentes/painel-de-tv.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Painel de TV\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Sofá",
    "image": "assets/presentes/sofa.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Sofá\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Aspirador de pó",
    "image": "assets/presentes/aspirador-de-po.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Aspirador de pó\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Passadeira a vapor",
    "image": "assets/presentes/passadeira-a-vapor.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Passadeira a vapor\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Cesto de roupas",
    "image": "assets/presentes/cesto-de-roupas.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Cesto de roupas\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Conjunto lixeira banheiro",
    "image": "assets/presentes/conjunto-lixeira-banheiro.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Conjunto lixeira banheiro\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Protetor de colchão",
    "image": "assets/presentes/protetor-de-colchao.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Protetor de colchão\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Cobertor",
    "image": "assets/presentes/cobertor.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Cobertor\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Jogo de cama",
    "image": "assets/presentes/jogo-de-cama.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Jogo de cama\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Cama box",
    "image": "assets/presentes/cama-box.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Cama box\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Lixeira automática",
    "image": "assets/presentes/lixeira-automatica.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Lixeira automática\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Porta-temperos",
    "image": "assets/presentes/porta-temperos.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Porta-temperos\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Batedeira",
    "image": "assets/presentes/batedeira.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Batedeira\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Grill",
    "image": "assets/presentes/grill.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Grill\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Forno elétrico",
    "image": "assets/presentes/forno-eletrico.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Forno elétrico\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Micro-ondas",
    "image": "assets/presentes/micro-ondas.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Micro-ondas\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Air fryer",
    "image": "assets/presentes/air-fryer.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Air fryer\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Chaleira elétrica",
    "image": "assets/presentes/chaleira-eletrica.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Chaleira elétrica\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Liquidificador",
    "image": "assets/presentes/liquidificador.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Liquidificador\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Jogo de copos",
    "image": "assets/presentes/jogo-de-copos.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Jogo de copos\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Jogo de xícaras",
    "image": "assets/presentes/jogo-de-xicaras.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Jogo de xícaras\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Taças de sobremesa",
    "image": "assets/presentes/tacas-de-sobremesa.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Taças de sobremesa\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Jogo de taças",
    "image": "assets/presentes/jogo-de-tacas.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Jogo de taças\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Jogo de copos 2",
    "image": "assets/presentes/jogo-de-copos-2.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Jogo de copos 2\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Aparelho de jantar",
    "image": "assets/presentes/aparelho-de-jantar.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Aparelho de jantar\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Faqueiro",
    "image": "assets/presentes/faqueiro.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Faqueiro\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Jogo de facas",
    "image": "assets/presentes/jogo-de-facas.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Jogo de facas\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Utensílios de silicone",
    "image": "assets/presentes/utensilios-de-silicone.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Utensílios de silicone\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Utensílios de inox",
    "image": "assets/presentes/utensilios-de-inox.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Utensílios de inox\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Tábuas de corte",
    "image": "assets/presentes/tabuas-de-corte.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Tábuas de corte\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Multiprocessador",
    "image": "assets/presentes/multiprocessador.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Multiprocessador\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Conjunto escorredor inox",
    "image": "assets/presentes/conjunto-escorredor-inox.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Conjunto escorredor inox\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Potes herméticos",
    "image": "assets/presentes/potes-hermeticos.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Potes herméticos\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Potes de vidro",
    "image": "assets/presentes/potes-de-vidro.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Potes de vidro\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Travessas de vidro",
    "image": "assets/presentes/travessas-de-vidro.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Travessas de vidro\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Travessas de cerâmica",
    "image": "assets/presentes/travessas-de-ceramica.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Travessas de cerâmica\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Formas de assar",
    "image": "assets/presentes/formas-de-assar.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Formas de assar\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Panela de pressão",
    "image": "assets/presentes/panela-de-pressao.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Panela de pressão\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Frigideiras",
    "image": "assets/presentes/frigideiras.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Frigideiras\" para vocês! Como podemos te enviar?"
  },
  {
    "name": "Potes organizadores",
    "image": "assets/presentes/potes-organizadores.webp",
    "whatsappMessage": "Oi Pedro quero doar \"Potes organizadores\" para vocês! Como podemos te enviar?"
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
    whatsappMessage: "Oi Pedro quero doar \"Netflix do casal (R$ 120,00)\" para vocês! Como podemos te enviar?"
  },
  {
    name: "Ganhar buquê de flores",
    price: "R$ 300,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_36_37.png",
    buttonText: "Presentear",
    whatsappMessage: "Oi Pedro quero doar \"Ganhar buquê de flores (R$ 300,00)\" para vocês! Como podemos te enviar?"
  },
  {
    name: "Não pegar fila no buffet",
    price: "R$ 400,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_36_43.png",
    buttonText: "Presentear",
    whatsappMessage: "Oi Pedro quero doar \"Não pegar fila no buffet (R$ 400,00)\" para vocês! Como podemos te enviar?"
  },
  {
    name: "Ter mesa reservada",
    price: "R$ 500,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_36_48.png",
    buttonText: "Presentear",
    whatsappMessage: "Oi Pedro quero doar \"Ter mesa reservada (R$ 500,00)\" para vocês! Como podemos te enviar?"
  },
  {
    name: "Despertador para a noiva",
    price: "R$ 135,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_38_41.png",
    buttonText: "Presentear",
    whatsappMessage: "Oi Pedro quero doar \"Despertador para a noiva (R$ 135,00)\" para vocês! Como podemos te enviar?"
  },
  {
    name: "Curso de culinária para noiva",
    price: "R$ 110,00",
    image: "assets/images/presentes-divertidos/ChatGPT Image 9 de mai. de 2026, 00_37_35.png",
    buttonText: "Presentear",
    whatsappMessage: "Oi Pedro quero doar \"Curso de culinária para noiva (R$ 110,00)\" para vocês! Como podemos te enviar?"
  }
];
