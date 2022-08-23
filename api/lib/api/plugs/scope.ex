defmodule Plug.Scope do
  import Plug.Conn

  @spec init(any) :: any
  def init(options) do
    options
  end

  defp invalid_scope(conn) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(403, "{\"error\":\"Insufficient scope\"}")
    |> halt
  end

  @spec call(Plug.Conn.t(), any) :: Plug.Conn.t()
  def call(%Plug.Conn{request_path: path} = conn, _opts) do
    conn
    |> halt
  end
end
