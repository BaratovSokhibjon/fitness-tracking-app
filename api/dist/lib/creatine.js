"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhase = getPhase;
exports.getCreatineConfig = getCreatineConfig;
const date_fns_1 = require("date-fns");
const prisma_1 = require("./prisma");
function getPhase(config, today) {
    const now = (0, date_fns_1.startOfDay)(today);
    const start = config.startDate ? (0, date_fns_1.startOfDay)(config.startDate) : null;
    if (!config.enabled || !start) {
        return { phase: "NOT_STARTED", day: 0, totalDays: 0, recommendedDose: config.maintenanceDose };
    }
    const daysSinceStart = Math.max(0, (0, date_fns_1.differenceInCalendarDays)(now, start));
    if (config.protocol === "LOADING" && daysSinceStart < config.loadingDays) {
        return { phase: "LOADING", day: daysSinceStart + 1, totalDays: config.loadingDays, recommendedDose: config.loadingDose };
    }
    if (config.protocol === "LOADING") {
        return { phase: "MAINTENANCE", day: daysSinceStart - config.loadingDays + 1, totalDays: Number.POSITIVE_INFINITY, recommendedDose: config.maintenanceDose };
    }
    return { phase: "MAINTENANCE", day: daysSinceStart + 1, totalDays: Number.POSITIVE_INFINITY, recommendedDose: config.maintenanceDose };
}
async function getCreatineConfig() {
    const profile = await prisma_1.prisma.profile.findUnique({ where: { userId: prisma_1.DEFAULT_USER_ID } });
    if (!profile)
        return null;
    return {
        enabled: profile.creatineEnabled,
        protocol: profile.creatineProtocol,
        startDate: profile.creatineStartDate,
        loadingDays: profile.creatineLoadingDays,
        loadingDose: profile.creatineLoadingDose,
        maintenanceDose: profile.creatineMaintenanceDose,
    };
}
