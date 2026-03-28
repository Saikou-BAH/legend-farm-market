export const homepageHighlights = [
  {
    title: 'Tarification administree dans Supabase',
    description:
      'Les prix, paliers et disponibilites viennent des donnees configurees dans le back-office.',
    icon: 'catalog',
  },
  {
    title: 'Traceabilite et stock live',
    description:
      'La boutique est pensee pour rester connectee a la realite de la ferme et au stock disponible.',
    icon: 'shield',
  },
  {
    title: 'Livraison structuree',
    description:
      'Zones, creneaux et frais vivent dans la base pour eviter les regles eparpillees dans le code.',
    icon: 'delivery',
  },
] as const

export const adminAccessMessages = {
  misconfigured: {
    title: 'Supabase n est pas encore configure',
    description:
      'Renseignez les variables d environnement de la boutique pour charger les donnees reelles.',
  },
  unauthenticated: {
    title: 'Connexion admin requise',
    description:
      'Connectez-vous avec un compte staff pour consulter le back-office de Legend Farm Shop.',
  },
  forbidden: {
    title: 'Acces back-office refuse',
    description:
      'Le compte connecte n a pas de profil staff actif dans la base Supabase de la boutique.',
  },
  missing_service_role: {
    title: 'Cle service manquante',
    description:
      'Ajoutez `SUPABASE_SERVICE_ROLE_KEY` pour charger les vues admin agregées en toute securite.',
  },
} as const
