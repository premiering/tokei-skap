// A level is the the collection of areas, for example, Exodus
// A area is a part of a level, like Exodus 25

export const trackedLevels: string[] = [
    "Exodus",
    "Space Advanced",
    "Infernus",
    "Inferno",
    "Nightmare",
    "Glacier Advanced",
    "April fools"
];

export interface TrackedTimelyArea {
    levelName: string,
    areaToReach: string
}

export const timelyTrackedAreas: TrackedTimelyArea[] = [
    {
        levelName: "Exodus",
        areaToReach: "Exodus 50 VICTORY"
    },
    {
        levelName: "Exodus",
        areaToReach: "Exodus 100 VICTORY"
    },
    {
        levelName: "Exodus",
        areaToReach: "Exodus 150 VICTORY"
    },
    {
        levelName: "Space Advanced",
        areaToReach: "Space Advanced 20 VICTORY"
    },
    {
        levelName: "Infernus",
        areaToReach: "Infernus 25"
    },
    {
        levelName: "Inferno",
        areaToReach: "Inferno 25"
    },
    {
        levelName: "Nightmare",
        areaToReach: "Nightmare 20"
    },
    // Testing
    {
        levelName: "Exodus",
        areaToReach: "Exodus 2"
    },
];

export function calculateAreaScore(area: string): number | undefined {
    area = area.toLowerCase();
    const regexNumber = area.match(/\d+/);
    if (regexNumber == null || regexNumber?.length <= 0) {
        return undefined;
    }
    let areaNumber = Number(regexNumber.toString());
    if (areaNumber <= 0) {
        return undefined;
    }

    if (area.includes("victory")) {
        areaNumber += 0.5;
    }
    return areaNumber;
}

export function getLevelFromArea(area: string): string | undefined {
    for (const tracked of trackedLevels) {
        if (!area.toLowerCase().includes(tracked.toLowerCase()))
            continue;

        // Check to see if the letter 2 spaces after the qualified name is a number
        // If it's not, it could be for example "Space Advanced 12" if we're looking for "Space 12"
        const num = area.at(tracked.length + 1);
        if (num == undefined || /\d/.test(num))
            return tracked;
    }
    return undefined;
}

export function isAreaTracked(area: string): boolean {
    for (const tracked of trackedLevels) {
        if (!area.toLowerCase().includes(tracked.toLowerCase()))
            continue;

        // Check to see if the letter 2 spaces after the qualified name is a number
        // If it's not, it could be for example "Space Advanced 12" if we're looking for "Space 12"
        const num = area.at(tracked.length + 1);
        if (num == undefined || /\d/.test(num))
            return true;
    }
    return false;
}

export function isAreaTimelyTracked(area: string): boolean {
    for (const tracked of timelyTrackedAreas) {
        if (!area.toLowerCase().includes(tracked.areaToReach.toLowerCase()))
            continue;

        return true;
    }
    return false;
}