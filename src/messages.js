// User-facing text is centralized so adding a locale is a small contribution.
const catalogs = {
    en: {
        claimed: (user, days) => `Assigned to @${user}. Comment with progress within ${days} days to keep the claim.`,
        alreadyClaimed: (user) => `This issue is already assigned to @${user}.`,
        limitReached: (max) => `You already hold the maximum of ${max} active claim(s).`,
        notEligible: 'This issue is not currently open for community claims.',
        released: (user) => `@${user} released this issue for someone else.`,
        cannotRelease: (user) => `@${user}, you can only release an issue assigned to you.`,
        stale: (user, days) => `Released @${user}'s claim after ${days} days without an update.`,
        welcome: (user) => `Thanks for your first pull request here, @${user}! A maintainer will review it when they can.`,
        prPassed: 'All configured contribution checks passed.',
    },
    es: {
        claimed: (user, days) => `Issue asignado a @${user}. Comparte avances antes de ${days} días para conservarlo.`,
        alreadyClaimed: (user) => `Este issue ya está asignado a @${user}.`,
        limitReached: (max) => `Ya alcanzaste el límite de ${max} issue(s) reclamado(s).`,
        notEligible: 'Este issue no está disponible actualmente para contribuciones de la comunidad.',
        released: (user) => `@${user} liberó este issue para otra persona.`,
        cannotRelease: (user) => `@${user}, solo puedes liberar un issue que tengas asignado.`,
        stale: (user, days) => `La asignación de @${user} se liberó después de ${days} días sin avances.`,
        welcome: (user) => `¡Gracias por tu primer pull request, @${user}! Un mantenedor lo revisará cuando pueda.`,
        prPassed: 'Todas las reglas configuradas para contribuciones fueron aprobadas.',
    },
};

export const messagesFor = (language) => catalogs[language] || catalogs.en;
