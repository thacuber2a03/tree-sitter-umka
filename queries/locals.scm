(block) @local.scope

(parameterList params: (typedIdentList
	(identList (ident) @local.definition)))

(methodDecl
	name: (ident) @local.definition)

(methodDecl
	receiver: (rcvSignature (ident) @local.definition)) @local.scope

(fnDecl name: (ident) @local.definition)

(varDeclItem identifiers:
	(typedIdentList (identList (ident) @local.definition)))

(ident) @local.reference
