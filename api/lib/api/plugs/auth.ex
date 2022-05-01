defmodule Plug.TokenAuth do
  import Plug.Conn

  @spec init(any) :: any
  def init(options) do
    options
  end

  defp authenticate({conn, token}) do
    case token === System.get_env("API_TOKEN", "") do
      false -> send_401(conn)
      true -> conn
    end
  end

  defp send_401(conn) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(401, "{\"error\":\"Unauthorized\"}")
    |> halt
  end

  defp get_auth_header(conn) do
    case get_req_header(conn, "authorization") do
      [token] -> {conn, token}
      _ -> {conn, nil}
    end
  end

  @spec call(Plug.Conn.t(), any) :: Plug.Conn.t()
  def call(%Plug.Conn{request_path: _path} = conn, _opts) do
    conn
    |> get_auth_header
    |> authenticate
  end
end
