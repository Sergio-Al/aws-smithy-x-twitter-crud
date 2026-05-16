Acá va una guía completa de Smithy IDL 2.0.

---

## 1. Instalación del CLI

El Smithy CLI está disponible para macOS, Linux y Windows, y permite trabajar con modelos sin necesidad de saber Java o Gradle.

**macOS (Homebrew):**

```bash
brew tap smithy-lang/tap
brew install smithy-cli
```

**Linux x86 (manual):**

```bash
mkdir -p smithy-install/smithy && \
curl -L https://github.com/smithy-lang/smithy/releases/download/1.70.0/smithy-cli-linux-x86_64.zip \
  -o smithy-install/smithy-cli-linux-x86_64.zip && \
unzip -qo smithy-install/smithy-cli-linux-x86_64.zip -d smithy-install && \
mv smithy-install/smithy-cli-linux-x86_64/* smithy-install/smithy
# Luego ejecutar el instalador:
sudo smithy-install/smithy/install
```

**Windows (PowerShell):**

```powershell
New-Item -Type Directory -Path smithy-install\smithy -Force
Invoke-WebRequest -Uri https://github.com/smithy-lang/smithy/releases/download/1.70.0/smithy-cli-windows-x64.zip `
  -OutFile smithy-install\smithy-cli-windows-x64.zip
Expand-Archive smithy-install\smithy-cli-windows-x64.zip -DestinationPath smithy-install\
smithy-install\smithy\install.bat
```

Verificar instalación:

```bash
smithy --version
```

---

## 2. Crear un proyecto nuevo

Con el comando `init` puedes inicializar un proyecto con todos los archivos y carpetas necesarios basados en plantillas, sin copiar y pegar manualmente.

```bash
smithy init --output ./mi-proyecto
```

Estructura generada:

```
mi-proyecto/
├── README.md
├── models/
│   └── weather.smithy
└── smithy-build.json
```

Para ver las plantillas disponibles:

```bash
smithy init --list
```

---

## 3. Anatomía de un servicio Smithy

Un modelo Smithy se compone de **service → operations → shapes**. Ejemplo mínimo:

```
$version: "2"
namespace com.example

// 1. Servicio principal
service ProductService {
    version: "2024-01-01"
    operations: [GetProduct, CreateProduct]
}

// 2. Operaciones
@http(method: "GET", uri: "/products/{productId}")
@readonly
operation GetProduct {
    input: GetProductInput
    output: GetProductOutput
    errors: [ProductNotFound]
}

@http(method: "POST", uri: "/products")
operation CreateProduct {
    input: CreateProductInput
    output: CreateProductOutput
}

// 3. Shapes (estructuras de datos)
structure GetProductInput {
    @required
    @httpLabel
    productId: String
}

structure GetProductOutput {
    @required product: Product
}

structure CreateProductInput {
    @required name: String
    @required price: Float
}

structure CreateProductOutput {
    @required productId: String
}

structure Product {
    @required productId: String
    @required name: String
    price: Float
}

// 4. Errores
@error("client")
@httpError(404)
structure ProductNotFound {
    @required message: String
}
```

---

## 4. Modelado con Resources (estilo REST)

Smithy soporta operaciones de ciclo de vida estándar sobre recursos: `create`, `put`, `read`, `update`, `delete` y `list`.

```
$version: "2"
namespace com.example

service OrderService {
    version: "2024-01-01"
    resources: [Order]
}

resource Order {
    identifiers: { orderId: String }
    create: CreateOrder
    read:   GetOrder
    list:   ListOrders
    delete: DeleteOrder
}
```

---

## 5. `smithy-build.json`

Archivo de configuración del proyecto (equivalente a `package.json` para Smithy):

```json
{
    "version": "1.0",
    "sources": ["models"],
    "projections": {
        "source": {
            "plugins": {
                "model": {}
            }
        }
    }
}
```

Para generar OpenAPI spec, agrega el plugin:

```json
{
    "version": "1.0",
    "sources": ["models"],
    "maven": {
        "dependencies": [
            "software.amazon.smithy:smithy-openapi:1.50.0"
        ]
    },
    "projections": {
        "openapi": {
            "plugins": {
                "openapi": {
                    "service": "com.example#ProductService"
                }
            }
        }
    }
}
```

---

## 6. Comandos esenciales del CLI

El CLI expone los siguientes comandos principales:

| Comando | Descripción |
| --- | --- |
| `smithy build` | Compila el modelo y genera artefactos |
| `smithy validate` | Valida el modelo sin generar nada |
| `smithy diff model-v1/ model-v2/` | Compara dos versiones del modelo |
| `smithy ast` | Exporta el modelo como JSON AST |
| `smithy select` | Consulta el modelo con selectores |
| `smithy clean` | Limpia artefactos de build |

---

## 7. Traits más usados

```
@required          // campo obligatorio
@httpLabel         // parte del path URI
@httpQuery("page") // query string param
@httpHeader("X-Api-Key") // header HTTP
@readonly          // operación de solo lectura
@idempotent        // operación idempotente
@length(min: 1, max: 100) // constraint de longitud
@range(min: 0, max: 999)  // constraint numérico
@pattern("^[a-z]+$")      // regex
@sensitive         // ocultar en logs/trazas
@deprecated        // marcar como obsoleto
```

---

## Flujo resumido

```
1. smithy init → crea proyecto
2. Editar models/*.smithy → defines service/operations/shapes
3. smithy validate → verificas errores de modelo
4. smithy build → generas OpenAPI, SDKs, etc.
```
