import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Bird,
  CheckCircle2,
  ChevronDown,
  Egg,
  Leaf,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Truck,
  WalletCards,
} from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getHomePageData, getPublicShopProfile } from '@/lib/actions/shop'

export const metadata: Metadata = {
  title: 'Accueil',
  description:
    'Oeufs frais, poulets reformes et fiente directement depuis la ferme. Commandez en ligne, livraison a domicile ou retrait a la ferme.',
}

const categories = [
  {
    title: 'Casiers d oeufs',
    description:
      'Casiers de 30 oeufs, demi-casiers ou a l unite. Ramasses a la ferme, dates de ponte connues.',
    icon: Egg,
    href: '/products?category=Oeufs',
  },
  {
    title: 'Poulets reformes',
    description:
      'Poules de ponte en fin de cycle. Viande ferme, prix accessibles. Disponibilite selon les lots en cours.',
    icon: Bird,
    href: '/products?category=Poulets',
  },
  {
    title: 'Sacs de fiente',
    description:
      'Fiente seche en sac, issue de notre elevage. Engrais naturel efficace pour le maraichage et les jardins.',
    icon: Leaf,
    href: '/products?category=Fiente',
  },
]

const reassuranceItems = [
  {
    icon: WalletCards,
    label: 'Prix en GNF',
    detail: 'Tarifs clairs, sans surprise',
  },
  {
    icon: Truck,
    label: 'Livraison a domicile',
    detail: 'Conakry, Kindia, Coyah, Dubreka, Forecariah',
  },
  {
    icon: MapPin,
    label: 'Retrait a la ferme',
    detail: 'Gratuit, sur rendez-vous',
  },
  {
    icon: MessageCircle,
    label: 'Grosses quantites',
    detail: 'Tarif degressif, livraison organisee',
  },
]

const whyItems = [
  {
    icon: ShieldCheck,
    title: 'Fraicheur garantie',
    description:
      'Les oeufs sont ramasses a la ferme regulierement. Chaque lot est tracable, date de ponte connue.',
  },
  {
    icon: CheckCircle2,
    title: 'Commande simple',
    description:
      'Sur le site ou par WhatsApp. Vous choisissez, on confirme la disponibilite et on s occupe du reste.',
  },
  {
    icon: Leaf,
    title: 'Direct producteur',
    description:
      'Pas d intermediaire. Les produits viennent directement de notre elevage jusqu a votre commande.',
  },
  {
    icon: WalletCards,
    title: 'Volume et gros volumes',
    description:
      'Tarif degressif a partir d un certain volume. Contactez-nous avant de valider pour organiser une commande speciale.',
  },
]

const howToOrderSteps = [
  {
    step: '1',
    title: 'Je choisis',
    description:
      'Parcourez le catalogue et ajoutez vos produits au panier.',
  },
  {
    step: '2',
    title: 'Je confirme',
    description:
      'Choisissez livraison a domicile ou retrait a la ferme. Nous confirmons la disponibilite rapidement.',
  },
  {
    step: '3',
    title: 'Je recois',
    description:
      'La commande est livree ou preparee pour le retrait selon votre choix.',
  },
]

const clientReviews = [
  {
    name: 'Mariama D.',
    role: 'Cliente reguliere',
    rating: 5,
    text: 'Les oeufs sont toujours frais et bien emballes. Je commande par WhatsApp chaque semaine, c est simple et rapide. Livraison ponctuelle.',
    initial: 'M',
  },
  {
    name: 'Ibrahima S.',
    role: 'Revendeur, Ratoma',
    rating: 5,
    text: 'Je prends des plateaux en grande quantite pour les revendre. Le tarif est correct et la qualite est stable. Je recommande.',
    initial: 'I',
  },
  {
    name: 'Fatoumata K.',
    role: 'Particulier, Kipé',
    rating: 5,
    text: 'J ai commande des poulets reformes, tres bonne viande. On m a bien explique la disponibilite et la livraison s est faite sans probleme.',
    initial: 'F',
  },
]

const faqItems = [
  {
    q: 'Peut-on commander par WhatsApp ?',
    a: 'Oui. Envoyez-nous un message avec ce que vous souhaitez. Nous confirmons la disponibilite et organisons la suite.',
  },
  {
    q: 'Comment retirer sa commande a la ferme ?',
    a: 'Contactez-nous avant de venir pour confirmer l horaire et que votre commande est prete.',
  },
  {
    q: 'Comment savoir si un produit est disponible ?',
    a: 'La disponibilite est indiquee sur chaque fiche produit. Pour les poulets, elle depend des lots en cours — contactez-nous pour confirmer.',
  },
]

export default async function HomePage() {
  const [homeData, shopProfile] = await Promise.all([
    getHomePageData(),
    getPublicShopProfile(),
  ])

  const featuredProducts = homeData.featuredProducts.slice(0, 6)
  const hasProducts = featuredProducts.length > 0

  return (
    <main className="pb-24">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="container pt-8 md:pt-12">
        <div className="section-grid relative overflow-hidden rounded-[2.5rem] bg-[#0c2618]">
          <div className="grid min-h-[520px] lg:grid-cols-[1.1fr_0.9fr]">

            {/* Left — texte */}
            <div className="relative flex flex-col justify-center px-8 py-12 md:px-12 md:py-14">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(50,120,70,0.18),transparent_60%)]" />
              <div className="relative space-y-8 hero-fade-up text-white">
                <div className="space-y-5">
                  <Badge variant="outline" className="gap-2 border-white/20 bg-white/10 text-white">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    Livraison locale · Retrait a la ferme
                  </Badge>
                  <h1 className="max-w-xl font-serif text-5xl leading-[1.05] md:text-6xl">
                    Oeufs frais, poulets et produits de ferme directement chez vous.
                  </h1>
                  <p className="max-w-md text-lg leading-8 text-white/72">
                    Commandez sur le site ou par WhatsApp. Livraison a domicile
                    ou retrait directement a la ferme.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-white text-[#0d2b1a] hover:bg-white/90">
                    <Link href="/products">
                      Voir la boutique
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <WhatsAppButton
                    phone={shopProfile.shopPhone}
                    label="Commander sur WhatsApp"
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    message="Bonjour Legend Farm, je voudrais passer une commande."
                  />
                </div>
              </div>
            </div>

            {/* Right — deux photos */}
            <div className="hidden lg:grid grid-rows-2 gap-3 p-4 hero-fade-up hero-fade-up-delay-2">
              <div
                className="overflow-hidden rounded-[1.6rem]"
                style={{ backgroundImage: "url('/images/hero-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
              <div
                className="overflow-hidden rounded-[1.6rem]"
                style={{ backgroundImage: "url('/images/hero-bg-2.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── RÉASSURANCE ─────────────────────────────────── */}
      <section className="container pt-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {reassuranceItems.map((item, i) => (
            <div
              key={item.label}
              className="reveal flex items-center gap-3 rounded-2xl border border-border/70 bg-white/72 px-4 py-3.5 text-sm"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium leading-tight">{item.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────── */}
      <section className="container pt-16 reveal">
        <div className="mb-8 space-y-3">
          <Badge variant="secondary">Nos produits</Badge>
          <h2 className="font-serif text-4xl md:text-5xl">
            Trois produits, des prix clairs.
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Oeufs, poulets reformes et fiente. Des produits concrets, bien
            presentes, avec les quantites et les tarifs en GNF.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((cat) => (
            <Card
              key={cat.title}
              className="group surface-panel overflow-hidden border-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(20,60,42,0.14)]"
            >
              <CardContent className="space-y-5 p-6">
                <div className="flex h-13 w-13 items-center justify-center rounded-[1.1rem] bg-primary/10 text-primary">
                  <cat.icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl">{cat.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={cat.href}>
                    Voir les {cat.title.toLowerCase()}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── PRODUITS DU MOMENT ──────────────────────────── */}
      <section className="container pt-16 reveal">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">
              {hasProducts ? 'A commander maintenant' : 'Catalogue'}
            </Badge>
            <h2 className="font-serif text-4xl md:text-5xl">
              {hasProducts
                ? 'Nos produits disponibles'
                : 'Le catalogue arrive bientot'}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {hasProducts
                ? 'Retrouvez les produits actuellement disponibles avec leurs prix en GNF et les quantites en stock.'
                : 'Nous preparons la mise en ligne de notre catalogue. En attendant, vous pouvez commander directement par WhatsApp.'}
            </p>
          </div>
          {hasProducts ? (
            <Button asChild variant="outline">
              <Link href="/products">
                Voir tout le catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>

        {hasProducts ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/products/${product.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="surface-panel overflow-hidden rounded-[2rem] px-6 py-10 md:px-10 md:py-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-4">
                <p className="font-serif text-2xl text-foreground">
                  Commandez des maintenant par WhatsApp
                </p>
                <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                  Notre boutique en ligne est en cours de preparation. En
                  attendant, ecrivez-nous sur WhatsApp avec votre commande —
                  oeufs, poulets reformes ou fiente — et nous organisons la
                  livraison ou le retrait ensemble.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Oeufs frais — plateaux, demi-plateaux ou a l unite
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Poulets reformes — selon disponibilite des lots
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Fiente — pour jardins, maraichage et cultures
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 md:flex-col">
                <WhatsAppButton
                  phone={shopProfile.shopPhone}
                  label="Commander sur WhatsApp"
                  message="Bonjour Legend Farm, je voudrais passer une commande."
                />
                <Button asChild variant="outline">
                  <Link href="/contact">Nous contacter</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── POURQUOI LEGEND FARM ────────────────────────── */}
      <section className="container pt-16 reveal">
        <div className="mb-8 space-y-3">
          <Badge variant="secondary">Pourquoi nous choisir</Badge>
          <h2 className="font-serif text-4xl md:text-5xl">
            Une ferme locale, une commande simple.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {whyItems.map((item) => (
            <Card key={item.title} className="surface-panel border-white/80">
              <CardContent className="flex gap-5 p-6">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── COMMENT COMMANDER ───────────────────────────── */}
      <section className="container pt-16 reveal">
        <div className="surface-panel-strong rounded-[2rem] px-8 py-10 text-white md:px-12 md:py-12">
          <div className="mb-10 space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/60">
              Tres simple
            </p>
            <h2 className="font-serif text-4xl">Comment passer une commande</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {howToOrderSteps.map((step) => (
              <div key={step.step} className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 font-serif text-lg font-semibold">
                  {step.step}
                </div>
                <div>
                  <p className="font-semibold text-white">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 border-t border-white/10 pt-8">
            <Button asChild size="lg">
              <Link href="/products">
                Voir la boutique
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── AVIS CLIENTS ────────────────────────────────── */}
      <section className="container pt-16 reveal">
        <div className="mb-8 space-y-3">
          <Badge variant="secondary">Avis clients</Badge>
          <h2 className="font-serif text-4xl md:text-5xl">
            Ce que nos clients disent.
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Des clients qui commandent regulierement, en particulier ou pour revendre.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {clientReviews.map((review) => (
            <Card key={review.name} className="surface-panel border-white/80">
              <CardContent className="space-y-4 p-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-foreground/85">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 font-semibold text-primary">
                    {review.initial}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="container pt-16 reveal">
        <div className="mb-8 space-y-3">
          <Badge variant="secondary">FAQ</Badge>
          <h2 className="font-serif text-4xl md:text-5xl">
            Questions frequentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border/70 bg-white/72"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between gap-4 px-5 py-4 font-medium">
                {item.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 pt-0 text-sm leading-7 text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────── */}
      <section className="container pt-16 reveal">
        <div className="surface-panel overflow-hidden rounded-[2rem]">
          <div className="grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div className="space-y-3">
              <h2 className="font-serif text-4xl md:text-5xl">
                Pret a commander ?
              </h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Parcourez notre catalogue en ligne ou contactez-nous directement
                sur WhatsApp pour organiser votre commande.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/products">
                  Voir la boutique
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <WhatsAppButton
                phone={shopProfile.shopPhone}
                label="WhatsApp"
                size="lg"
                variant="outline"
                message="Bonjour Legend Farm, je voudrais passer une commande."
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
