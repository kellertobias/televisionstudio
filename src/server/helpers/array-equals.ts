export default (array1: any[], array2: any[]) => {
    if (array1.length !== array2.length) return false
    return array1.every((value, index) => value === array2[index])
}

export const startsWith = (haystack: any[], needle: any[]) => {
    return needle.every((value, index) => value === haystack[index])
}

export const endsWith = (haystack: any[], needle: any[]) => {
    haystack = haystack.reverse()
    return needle.reverse().every((value, index) => value === haystack[index])
}