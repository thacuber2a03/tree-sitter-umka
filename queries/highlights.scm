["fn" "var"] @keyword

["=" ":=" "*" ":" ","] @operator

(methodDecl
	receiver: (rcvSignature name: (ident) @variable.parameter)
	name: (ident) @function.method)

(fnDecl name: (ident) @function)

(signature params: (typedIdentList
	(identList (ident) @variable.parameter)))

(stringLiteral)  @string
(escSeq) @string.special
(comment) @comment
(type) @type
((type) @type.builtin
	(#match? @type.builtin "^(void|int8|int16|int32|int|uint8|uint16|uint32|uint|bool|char|real32|real|fiber|any)$"))

(builtinCall name: (qualIdent
	identifier: (ident)) @function)

(builtinCall name: (qualIdent
	identifier: (ident)) @function.builtin
	(#match? @function.builtin "^(printf|sprintf|fprintf)$"))

[
	(decNumber)
	(hexNumber)
	(realNumber)
] @number
