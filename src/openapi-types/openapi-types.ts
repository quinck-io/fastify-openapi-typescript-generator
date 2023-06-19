import openapiTS from 'openapi-typescript'

export const generateOpenapiTypes = (
    openapiFilePath: string,
): Promise<string> => {
    const localPath = new URL(openapiFilePath, import.meta.url)

    return openapiTS(localPath)
}
