"""
Marshmallow schemas for input validation (OWASP: Input Validation).
All incoming JSON is validated before hitting the database.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError, EXCLUDE


class RegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    email     = fields.Email(required=True)
    password  = fields.Str(required=True, validate=validate.Length(min=6, max=128))


class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email    = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=1))


class ProductSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    name                = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description         = fields.Str(load_default='', validate=validate.Length(max=2000))
    price               = fields.Float(required=True, validate=validate.Range(min=0.01))
    buy_price           = fields.Float(load_default=None, validate=validate.Range(min=0))
    stock               = fields.Int(load_default=0, validate=validate.Range(min=0))
    category_id         = fields.Int(required=True, validate=validate.Range(min=1))
    supplier_id         = fields.Int(load_default=None, validate=validate.Range(min=1), allow_none=True)
    sku                 = fields.Str(load_default=None, validate=validate.Length(max=50), allow_none=True)
    low_stock_threshold = fields.Int(load_default=10, validate=validate.Range(min=0))
    image_url           = fields.Str(load_default=None, validate=validate.Length(max=500), allow_none=True)


class ProductUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    name                = fields.Str(validate=validate.Length(min=1, max=200))
    description         = fields.Str(validate=validate.Length(max=2000))
    price               = fields.Float(validate=validate.Range(min=0.01))
    buy_price           = fields.Float(validate=validate.Range(min=0), allow_none=True)
    stock               = fields.Int(validate=validate.Range(min=0))
    category_id         = fields.Int(validate=validate.Range(min=1))
    supplier_id         = fields.Int(validate=validate.Range(min=1), allow_none=True)
    sku                 = fields.Str(validate=validate.Length(max=50), allow_none=True)
    low_stock_threshold = fields.Int(validate=validate.Range(min=0))
    image_url           = fields.Str(validate=validate.Length(max=500), allow_none=True)
    is_active           = fields.Bool()


class CategorySchema(Schema):
    class Meta:
        unknown = EXCLUDE

    category_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description   = fields.Str(load_default='', validate=validate.Length(max=500))


class SupplierSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    supplier_name = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    phone         = fields.Str(load_default='', validate=validate.Length(max=30))
    address       = fields.Str(load_default='', validate=validate.Length(max=500))
    email         = fields.Email(load_default=None, allow_none=True)


class OrderItemSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    product_id = fields.Int(required=True, validate=validate.Range(min=1))
    quantity   = fields.Int(required=True, validate=validate.Range(min=1))


class OrderSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    items            = fields.List(fields.Nested(OrderItemSchema), required=True, validate=validate.Length(min=1))
    payment_method   = fields.Str(load_default='cash', validate=validate.OneOf(['cash', 'card', 'bank_transfer', 'online']))
    shipping_address = fields.Str(load_default=None, validate=validate.Length(max=500), allow_none=True)


class StockAdjustSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    product_id  = fields.Int(required=True, validate=validate.Range(min=1))
    quantity    = fields.Int(required=True)   # positive = add, negative = remove
    change_type = fields.Str(load_default='manual_adjustment',
                             validate=validate.OneOf(['manual_adjustment', 'restock', 'damage', 'loss', 'return']))
    notes       = fields.Str(load_default=None, validate=validate.Length(max=500), allow_none=True)


class UserCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    email     = fields.Email(required=True)
    password  = fields.Str(required=True, validate=validate.Length(min=6, max=128))
    role      = fields.Str(load_default='user', validate=validate.OneOf(['admin', 'staff', 'user']))
    is_active = fields.Bool(load_default=True)


class UserUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    full_name = fields.Str(validate=validate.Length(min=2, max=150))
    email     = fields.Email()
    password  = fields.Str(validate=validate.Length(min=6, max=128))
    role      = fields.Str(validate=validate.OneOf(['admin', 'staff', 'user']))
    is_active = fields.Bool()


class ProfileUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    full_name = fields.Str(validate=validate.Length(min=2, max=150))
    email     = fields.Email()
    password  = fields.Str(validate=validate.Length(min=6, max=128))


def validate_schema(schema_class, data):
    """
    Validate data against a schema.
    Returns (cleaned_data, None) on success or (None, error_message) on failure.
    """
    try:
        result = schema_class().load(data or {})
        return result, None
    except ValidationError as e:
        # Flatten all field errors into a single readable string
        messages = []
        for field, errors in e.messages.items():
            if isinstance(errors, list):
                messages.append(f"{field}: {', '.join(errors)}")
            else:
                messages.append(f"{field}: {errors}")
        return None, '; '.join(messages)
