export const trackedAreas: string[] = [
    "Exodus",
    "Space Advanced",
    "Infernus",
    "Inferno",
    "Nightmare"
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

export function getTrackedNameFromArea(area: string): string | undefined {
    for (const tracked of trackedAreas) {
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
    for (const tracked of trackedAreas) {
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