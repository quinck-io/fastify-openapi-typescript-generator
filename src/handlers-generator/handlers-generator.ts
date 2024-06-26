import { loadOpenapi } from '../openapi-loader/openapi-loader.js'
import { disableLinter, openapiTypesModule } from '../utils/consts.js'
import { OpenAPIVX } from '../utils/types.js'
import {
    fastifyImports,
    handlersInterfacePostfix,
    handlersInterfacePrefix,
    methods,
    openapiOperationsImport,
    utilityTypesDefinition,
} from './handlers-generator.constants.js'
import { HandlerProperties } from './handlers-generator.models.js'

export async function generateHandlers(
    openapiFilePath: string,
): Promise<string> {
    const openapi = await loadOpenapi(openapiFilePath)

    const handlersProperties = getHandlersProperties(openapi)

    const operations = handlersProperties.map(({ operationId, summary }) => {
        const routeString = getRouteGenericString(operationId)
        const handler = `${operationId}: ${routeString}`
        const documentation = createDocumentation(summary)
        return `${documentation}\n\t${handler}`
    })

    return formatHandlers(operations)
}

function createDocumentation(summary?: string): string {
    if (typeof summary == 'string') {
        return `
  /**
   * ${summary}
   */`
    }

    return ''
}

function getRouteGeneric(operationId: string): string {
    const routeGenricDefinition = `
            Params: Params<'${operationId}'>
            Querystring: Querystring<'${operationId}'>
            Body: Body<'${operationId}'>
            Reply: Reply<'${operationId}'>
            Headers: Headers<'${operationId}'>
        `
    return `{\n${routeGenricDefinition}\n\t}`
}

function getRouteGenericString(operationId: string): string {
    return `RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    ${getRouteGeneric(operationId)}
  >`
}

function getHandlersProperties(openapi: OpenAPIVX): HandlerProperties[] {
    return Object.values(openapi.paths ?? {}).flatMap(path =>
        methods.flatMap(method => {
            if (path && path[method]) {
                const summary = path[method]?.summary
                const operationId = path[method]?.operationId
                if (operationId) return { operationId, summary }
            }
            return []
        }),
    )
}

function formatHandlers(operations: string[]): string {
    const operationsFormatted = operations.join('\n')

    return `${disableLinter}

${fastifyImports}
${openapiOperationsImport(openapiTypesModule)}

${utilityTypesDefinition}


${handlersInterfacePrefix}
${operationsFormatted}
${handlersInterfacePostfix}
`
}
