/**
     * Rounds a number up to nearest multiple.
     *
     * @param numToRound - The number to round up.
     * @param multiple - The multiple to round up to.
     * @returns A number rounded up to nearest multiple.
     */
export function roundUp(numToRound: number, multiple: number) {
    if (multiple === 0) {
        return numToRound;
    }
    return Math.ceil(numToRound / multiple) * multiple;
}
