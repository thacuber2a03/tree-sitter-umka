["const" "enum" "fn" "map" "import" "interface" "struct" "type" "var" "weak" "in"] @keyword

["if" "for"] @keyword.conditional

["append" "atan" "atan2" "cap" "ceil" "copy" "cos" "delete"
 "exit" "exp" "fabs" "fiberalive" "fibercall" "fiberspawn"
 "floor" "fprintf" "fscanf" "insert" "keys" "len" "log" "make"
 "memusage" "new" "printf" "round" "scanf" "selfhasptr"
 "selftypeeq" "sin" "sizeof" "sizeofself" "slice" "sprintf"
 "sqrt" "sscanf" "trunc" "typeptr" "valid" "validkey"] @support.function @function.builtin

["=" ":=" "*" ":" "," "::"] @operator

(methodDecl
	receiver: (rcvSignature name: (ident) @variable.parameter)
	name: (ident) @function.method)

(fnDecl name: (ident) @function)

(parameterList params: (typedIdentList
	(identList (ident) @variable.parameter)))

(structType (typedIdentList
    (identList (ident) @property)))

(constDeclItem name: (ident) @constant)
(enumItem) @constant
(stringLiteral)  @string
(stringFmtLiteral)  @string
(stringImportLiteral)  @string
(escSeq) @string.special
(fmtSeq) @string.special
(comment) @comment
(importItem name: (ident) @module)
(typeDeclItem name: (ident) @type)
(type (qualIdent name: (ident) @type))
(type (qualIdent module: (ident) @module name: (ident) @type))
(modSeq name: (ident) @module)
((type) @type.builtin
	(#match? @type.builtin "^(str|void|int8|int16|int32|int|uint8|uint16|uint32|uint|bool|char|real32|real|fiber|any)$"))

((ident) @constant.builtin
	(#match? @constant.builtin "^(true|false|null)$"))

[ (decNumber) (hexNumber) (realNumber) ] @number
