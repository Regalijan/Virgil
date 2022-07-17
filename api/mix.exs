defmodule Api.MixProject do
  use Mix.Project

  def project do
    [
      app: :api,
      version: "0.1.0",
      elixir: "~> 1.13",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      applications: [
        :amqp,
        :dotenv,
        :hackney,
        :jason,
        :mongodb_driver,
        :plug_cowboy
      ],
      extra_applications: [:logger],
      mod: {Api.Application, []}
    ]
  end

  defp deps do
    [
      {:amqp, "~> 3.1"},
      {:dotenv, "~> 3.1.0"},
      {:finch, "~> 0.12.0"},
      {:jason, "~> 1.3"},
      {:mongodb_driver, "~> 0.8.4"},
      {:plug_cowboy, "~> 2.5"}
    ]
  end
end
