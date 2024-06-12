const implSemi = /[;\n]/
const optSeq = (...rules) => optional(seq(...rules))
const repSeq = (...rules) => repeat(seq(...rules))

module.exports = grammar({
  name: "umka",

  inline: $ => [
    $.decl,
    $.stmt,
    $.expr,
    $.number,
    $.varDecl,
    $.declAssignmentStmt,
  ],

  extras: $ => [
    $.comment,
    /\s/,
  ],

  word: $ => $.ident,

  conflicts: $ => [
    [$.fnDecl],
    [$.methodDecl],
  ],

  rules: {
    program: $ => seq(
      repeat($.decl)
    ),

    decl: $ => choice(
      $.fnDecl,
      $.methodDecl,
      $.varDecl,
      $.typeDecl,
    ),

    varDecl: $ => choice(
      $.fullVarDecl,
      alias($.declAssignmentStmt, $.shortVarDecl)
    ),

    fullVarDecl: $ => seq("var", choice(
      $.varDeclItem,
      seq("(", repSeq($.varDeclItem, implSemi), ")"),
    )),

    varDeclItem: $ => seq(
      field('identifiers', $.typedIdentList),
      "=", field('value', $.expr)
    ),

    exportMark: $ => '*',

    identList: $ => seq(
      $.ident, field('exported', optional('*')),
      repSeq(",", $.ident, field('exported', optional($.exportMark))),
    ),

    typedIdentList: $ => seq($.identList, ":", optional(".."), $.type),

    typeDecl: $ => seq('type',
      choice($.typeDeclItem, seq("(", repSeq($.typeDeclItem, implSemi), ")"))
    ),

    typeDeclItem: $ => seq(
      field('name', $.ident),
      optional($.exportMark),
      '=', $.type,
    ),

    type: $ => choice(
      $.qualIdent,
      $.ptrType,
      $.arrayType,
      $.dynArrayType,
      $.enumType,
      $.structType,
      $.mapType,
      $.interfaceType,
      $.closureType,
    ),

    ptrType: $ => seq(optional("weak"), '^', $.type),
    arrayType: $ => seq('[', $.expr, ']', $.type),
    dynArrayType: $ => seq('[', ']', $.type),
    enumType: $ => seq('enum', '{', repeat($.enumItem), '}'),
    enumItem: $ => seq(field('name', $.ident), implSemi),
    structType: $ => seq('struct', '{', repSeq($.typedIdentList, implSemi), '}'),

    mapType: $ => seq('map', '[', $.type, ']', $.type),
    interfaceType: $ => seq('interface', '{', repeat($.interfaceItem), '}'),

    interfaceItem: $ => choice(
      field('type', $.ident),
      seq(field('name', $.ident), $.signature),
    ),

    closureType: $ => seq('fn', $.signature),

    signature: $ => seq($.parameterList, optSeq(':', $.type)),

    declAssignmentStmt: $ => seq(
      field('identifiers', $.identList),
      ":=", field('values', $.exprList)
    ),

    fnDecl: $ => seq("fn",
      field('name', $.ident),
      optional(field('exported', '*')),
      field('signature', $.signature),
      optional(field('body', $.block)),
    ),

    methodDecl: $ => seq("fn",
      field('receiver', $.rcvSignature),
      field('name', $.ident),
      optional(field('exported', '*')),
      field('signature', $.signature),
      optional(field('body', $.block)),
    ),

    rcvSignature: $ => seq("(",
      field('name', $.ident), ":",
      field('type', $.type),
    ")"),

    exprList: $ => seq($.expr, repSeq(",", $.expr)),

    signature: $ => seq("(",
      optSeq(
        field('params', $.typedIdentList),
        optSeq('=', field('defaultValue', $.expr)),
      ),
      repSeq(","
        field('params', $.typedIdentList),
        optSeq('=', field('defaultValue', $.expr)),
      ),
    ")", ":", field('returnTypes', choice(
      $.type,
      "(", $.type, repSeq(",", $.type), ")"
    ))),

    block: $ => seq("{", repSeq($.stmt, optional(';')), "}"),

    stmt: $ => choice(
      alias($.designator, $.callStmt),
      $.block,
      $.decl,
    ),

    expr: $ => choice($.stringLiteral, $.number),

    designator: $ => seq(choice($.primary)),

    primary: $ => choice($.qualIdent, $.builtinCall),

    qualIdent: $ => seq(
      optSeq(field('module', $.ident), '::'),
      field('identifier', $.ident)
    ),

    builtinCall: $ => seq(
      field('name', $.qualIdent),
      field('arguments', seq("(",
        optSeq($.expr, repSeq(",", $.expr)), ")"
      ))
    ),

    ident: $ => /[A-Za-z_][A-Za-z_0-9]*/,

    number: $ => choice($.realNumber, $.hexNumber, $.decNumber),

    decNumber: $ => /[0-9]+/,
    hexNumber: $ => /[0-9a-fA-F]+/,

    realNumber: $ => choice(
      /[0-9]+\.[0-9]+/,
      /[0-9]+[Ee]\-?[0-9]+/,
      /[0-9]+\.[0-9]+[Ee]\-?[0-9]+/,
    ),

    charLiteral: $ => seq("'", repeat(choice($.escSeq, /./)), '"'),
    stringLiteral: $ => seq('"', repeat(choice($.escSeq, /./)), '"'),

    escSeq: $ => choice(/\\[0abefnrtv]/, /\\x[0-9a-fA-F][0-9a-fA-F]*/),

    comment: $ => token(choice(
      seq('//', /.*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),
  }
})
