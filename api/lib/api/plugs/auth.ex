defmodule Plug.TokenAuth do
  import Plug.Conn

  @spec init(any) :: any
  def init(options) do
    options
  end

  defp authenticate({conn, token}) do
    token_entry =
      Mongo.find_one(
        :mongo,
        "tokens",
        %{
          token_hash:
            :crypto.hash("sha256", token)
            |> :base64.encode_to_string()
        }
      )

    case is_nil(token_entry) do
      true -> send_401(conn)
      false -> conn
    end
  end

  defp check_if_token_nil({conn, token}) do
    case token == nil do
      false -> send_401(conn)
      true -> conn
    end
  end

  defp get_auth_header(conn) do
    case get_req_header(conn, "authorization") do
      [token] -> {conn, token}
      _ -> {conn, nil}
    end
  end

  defp send_401(conn) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(401, "{\"error\":\"Unauthorized\"}")
    |> halt
  end

  @spec call(Plug.Conn.t(), any) :: Plug.Conn.t()
  def call(%Plug.Conn{request_path: _path} = conn, _opts) do
    conn
    |> get_auth_header
    |> authenticate
  end
end
