import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from config import Config

_pool = None

def get_pool():
    global _pool
    if _pool is None:
        _pool = pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            **Config.DB_CONFIG
        )
    return _pool

def get_db_connection():
    return get_pool().getconn()

def put_db_connection(conn):
    get_pool().putconn(conn)

def _get_cursor(conn, dict_cursor=False):
    if dict_cursor:
        return conn.cursor(cursor_factory=RealDictCursor)
    return conn.cursor()

def _execute(query, params, dict_cursor=False, fetch_one=False, fetch_all=True, returning=False):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = _get_cursor(conn, dict_cursor=dict_cursor)
        cur.execute(query, params) if params else cur.execute(query)
        if returning:
            result = cur.fetchone()
            row_id = result[0] if result else None
            conn.commit()
            return row_id
        if fetch_one:
            result = cur.fetchone()
        elif fetch_all:
            result = cur.fetchall()
        else:
            result = None
        conn.commit()
        return result
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise Exception(f"Database error: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            put_db_connection(conn)

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    return _execute(query, params, dict_cursor=True, fetch_one=fetch_one, fetch_all=fetch_all)

def execute_insert(query, params):
    return _execute(query + " RETURNING id;", params, returning=True)

def execute_update(query, params):
    _execute(query, params, fetch_one=False, fetch_all=False)
    return True

def execute_delete(query, params):
    _execute(query, params, fetch_one=False, fetch_all=False)
    return True
